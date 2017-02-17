import React from "react"
import {defaultHeadersFor} from "../utils/http"
import path from "path"
import {render} from "../utils/template"
import {requireUncached} from "../utils/require"
import {templatePath} from "../index"

const singlePostHandler = {
  async handle({project, url}) {
    const id = url.substr(1)
    const post = await project.valueOf({id: `post@${id}`})

    const Template = requireUncached(path.join(process.cwd(), templatePath, "blog-post")).template
    const str = render({jsx: <Template {...post} />})

    return {
      body: str,
      headers: defaultHeadersFor({defaultContentType: "text/html", url})
    }
  },
  async handles({posts}) {
    return posts.map((p) => `/${p.split("@")[1]}`)
  },
  async handlesArguments({project}) {
    const posts = await project.metaOf({id: "posts"})
    return {posts: posts.children}
  }
}
export {singlePostHandler}
