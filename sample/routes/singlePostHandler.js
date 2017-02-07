import path from "path";
import React from "react";
import {requireUncached} from "../../app/utils";
import {templatePath} from "../index";
import {render} from "../utils/template";
import {defaultHeadersFor} from "../utils/http";

const singlePostHandler = {
  async handlesArguments({project}) {
    const posts = await project.metaOf({id: "posts"});
    return {
      posts: posts.children
    };
  },
  async handles({posts}) {
    return posts.map(p => `/${p.split("@")[1]}`);
  },
  async handle({project, url}) {
    const id = url.substr(1);
    const post = await project.valueOf({id: `post@${id}`});

    const Template = requireUncached(path.join(process.cwd(), templatePath, "template")).template;
    const str = render({jsx: <Template content={post.htmlContent} />});

    return {
      headers: defaultHeadersFor({url, defaultContentType: "text/html"}),
      body: str
    }
  }
};
export {singlePostHandler};
