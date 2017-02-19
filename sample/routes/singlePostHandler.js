import React from "react"
import {defaultHeadersFor} from "../utils/http"
import path from "path"
import {render} from "../utils/template"
import {requireUncached} from "../utils/require"
import {templatePath} from "../index"
import {urlForPost} from "../utils/url"
import {urlToIdPart} from "../utils/id"

const singlePostHandler = {
  async handle({project, url}) {
    const id = urlToIdPart({url})
    const post = await project.valueOf({id: `post@${id}`})

    const Template = requireUncached(path.join(process.cwd(), templatePath, "blogPost")).template
    const str = render({jsx: <Template {...post} />})

    return {
      body: str,
      headers: defaultHeadersFor({defaultContentType: "text/html", url})
    }
  },
  async handles({posts}) {
    return posts.map((p) => urlForPost({id: p}))
  },
  async handlesArguments({project}) {
    const posts = await project.metaOf({id: "posts"})
    return {posts: posts.children}
  }
}
export {singlePostHandler}
