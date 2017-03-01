import React from "react"
import {chunk} from "../../app/utils/misc"
import {defaultHeadersFor} from "../utils/http"
import path from "path"
import {render} from "../utils/template"
import {requireUncached} from "../utils/require"
import {templatePath} from "../index"

const calculatePagination = ({posts}) => {
  const paginatedContentIds = chunk({array: posts, chunkSize: 10})
  return paginatedContentIds.map((ids, index, array) => {
    const isFirstPage = index === 0
    const isLastPage = index === array.length - 1
    const pageNumber = index + 1
    return {ids, isFirstPage, isLastPage, pageNumber}
  })
}

const recentPostsCollectionHandler = {
  async handle({project, url}) {
    const pageNumber = Number(url.substr(1) || 1) - 1
    const postIds = (await project.metaOf({id: "postCollection"})).children
    const postsInPage = calculatePagination({posts: postIds})[pageNumber]

    const posts = await Promise.all(
      postsInPage.ids
        .map((id) => project.valueOf({id}).then((value) => ({id, ...value})))
    )

    const Template = requireUncached(path.join(process.cwd(), templatePath, "multiplePosts")).default
    const str = render({
      jsx: <Template
        pageNumber={pageNumber}
        posts={posts}
           />
    })

    return {
      body: str,
      headers: defaultHeadersFor({url: `${url}/index.html`})
    }
  },
  async handles({posts}) {
    const paginatedPostCollection = calculatePagination({posts})

    return paginatedPostCollection.map(({isFirstPage}, index) => `/${isFirstPage ? "" : index}`)
  },
  async handlesArguments({project}) {
    const posts = await project.metaOf({id: "postCollection"})
    return {posts: posts.children}
  }
}
export {recentPostsCollectionHandler}
