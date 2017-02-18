import {idToType, isGeneratedImagePath, isPathImage, urlToPath} from "../utils/id"
import {defaultHeadersFor} from "../utils/http"
import {postSubfolder} from "../index"
import {urlForPostAttachment} from "../utils/url"

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
  async handles({nonImageChildren, scaledOrCompressedImages}) {
    return [...nonImageChildren, ...scaledOrCompressedImages]
      .map((id) => urlForPostAttachment({id}))
  },
  async handlesArguments({project}) {
    const posts = await project.metaOf({id: "posts"})
    const arrayOfChildMeta = await Promise.all(posts.children.map((post) => project.metaOf({id: post})))
    const postChildrenIds = arrayOfChildMeta.reduce((acc, meta) => [...acc, ...(meta.children)], [])
    const nonImageChildren = postChildrenIds.filter((pci) => idToType({id: pci}) !== "image")

    const postImageIds = postChildrenIds.filter((pci) => idToType({id: pci}) === "image")
    const arrayOfScaledOrCompressedImagesMeta = await Promise.all(postImageIds.map((c) => project.metaOf({id: c})))
    const scaledOrCompressedImages = arrayOfScaledOrCompressedImagesMeta
      .reduce((acc, meta) => [...acc, ...(meta.children)], [])

    return {
      nonImageChildren,
      scaledOrCompressedImages
    }
  }
}
export {binaryPassthroughHandler}
