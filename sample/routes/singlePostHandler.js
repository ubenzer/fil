import ReactDOMServer from 'react-dom/server';
import path from "path";
import React from "react";

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
  async handle({utils, project, url}) {
    const id = url.substr(1);
    const content = await project.valueOf({id: `post@${id}`});

    const Template = utils.requireUncached(path.join(process.cwd(), "template", "template")).template;
    const str = ReactDOMServer.renderToStaticMarkup(<Template content={id + content} />);

    return {
      headers: [],
      body: str
    }
  }
};
export {singlePostHandler};
