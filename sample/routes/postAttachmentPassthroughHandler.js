import {idToPath, idToType, isGeneratedImagePath, isPathImage, urlToPath} from "../utils/id"
import {defaultHeadersFor} from "../utils/http"
import {postSubfolder} from "../index"

const binaryPassthroughHandler = {
  async handle({project, url}) {
    const p = urlToPath({url})
    const isImage = isPathImage({p})
    const isScaledImage = isGeneratedImagePath({p})
    /* eslint-disable no-nested-ternary */
    const type = isImage ? isScaledImage ? "scaledImage" : "compressedImage" : "file"
    /* eslint-enable no-nested-ternary */

    const id = `${type}@${postSubfolder}/${p}`
    const value = await project.valueOf({id})

    return {
      body: value.content,
      headers: defaultHeadersFor({url})
    }
  },
  async handles({attachmentIds, scaledImageIds}) {
    return [...attachmentIds, ...scaledImageIds]
      .map((id) => idToPath({id}))
      // we get rid of post part of id (--->post<---/2010/05/finaller/finaller-500.scaled.webp)
      .map((url) => url.substr(postSubfolder.length))
  },
  async handlesArguments({project}) {
    const posts = await project.metaOf({id: "posts"})
    const arrayOfChildMeta = await Promise.all(posts.children.map((post) => project.metaOf({id: post})))
    const postChildrenIds = arrayOfChildMeta.reduce((acc, meta) => [...acc, ...(meta.children)], [])

    const postImageIds = postChildrenIds.filter((pci) => idToType({id: pci}) === "image")
    const arrayOfScaledImageMeta = await Promise.all(postImageIds.map((c) => project.metaOf({id: c})))
    const scaledImageIds = arrayOfScaledImageMeta.reduce((acc, meta) => [...acc, ...(meta.children)], [])

    return {
      attachmentIds: postChildrenIds,
      scaledImageIds
    }
  }
}
export {binaryPassthroughHandler}
