import {fromGeneratedImagePath, idToPath, pathToIdPart} from "../utils/id"
import {contentPath} from "../index"
import path from "path"
import {resizeByWidth} from "../utils/image"

export const scaledImage = {
  content: async ({id, originalImage, width}) => {
    const p = path.join(contentPath, idToPath({id}))
    const ext = path.extname(p).substr(1)
    const resizedImageAsBuffer = await resizeByWidth({
      ext,
      src: originalImage.content,
      width
    })

    return {content: resizedImageAsBuffer}
  },
  contentArguments: async ({id, project}) => {
    const p = idToPath({id})
    const {dimension, originalPath} = fromGeneratedImagePath({p})
    const sourceId = `image@${pathToIdPart({p: originalPath})}`

    const originalImage = await project.valueOf({id: sourceId})

    return {
      id,
      originalImage,
      sourceId,
      width: dimension
    }
  }
}


