import {compress} from "../utils/image"
import {contentPath} from "../index"
import {idToPath} from "../utils/id"
import path from "path"

export const compressedImage = {
  content: async ({id}) => {
    const p = path.join(contentPath, idToPath({id}))
    const i = await compress({src: p})
    return {content: i}
  },
  contentArguments: async ({id, project}) => {
    const p = idToPath({id})
    const sourceId = `image@${p}`

    const originalImage = await project.valueOf({id: sourceId})

    return {id, originalImage}
  }
}
