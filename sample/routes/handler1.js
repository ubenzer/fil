import ReactDOMServer from 'react-dom/server';
import path from "path";
import React from "react";

export class ExperimentalHandler {
  async handlesArguments({project}) {
    const posts = await project.metaOf({contentId: ["postCollection"]});
    return {
      posts: posts.children
    };
  }
  async handles({posts}) {
    return posts.map(p => `/${p}`);
  }

  async handle({utils, project, url}) {
    const id = url.substr(1);
    const content = await project.contentOf({contentId: ["post", id]});

    const Template = utils.requireUncached(path.join(process.cwd(), "template", "template")).template;
    const str = ReactDOMServer.renderToStaticMarkup(<Template content={id + content} />);

    return {
      headers: [],
      body: str
    }
  }
}
const experimentalHandler = new ExperimentalHandler();
export default experimentalHandler;
