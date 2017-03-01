import {chunk} from "../../app/utils/misc"
import {defaultHeadersFor} from "../utils/http"

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
    const posts = (await project.metaOf({id: "postCollection"})).children
    const postsInPage = calculatePagination({posts})[pageNumber]

    const postContents = await Promise.all(
      postsInPage.ids
        .map((id) => project.valueOf({id}).then((value) => ({id, value})))
    )

    const content = postContents.reduce((acc, {value, id}) => `${acc}ÜÜÜ${value.htmlExcerpt}ÄÄÄ${id}`, "")

    return {
      body: content,
      headers: defaultHeadersFor({defaultContentType: "text/html", url})
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
