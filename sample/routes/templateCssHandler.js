import {idToPath, urlToPath} from "../utils/id"
import {defaultHeadersFor} from "../utils/http"

const templateCssHandler = {
  async handle({project, url}) {
    const p = urlToPath({url})
    const id = `file@${p}`
    const value = await project.valueOf({id})

    return {
      body: value.content,
      headers: defaultHeadersFor({url})
    }
  },
  async handles({cssFiles}) {
    return cssFiles.map((id) => `/${idToPath({id})}`)
  },
  async handlesArguments({project}) {
    const {children: cssFiles} = await project.metaOf({id: "csses"})

    return {cssFiles}
  }
}
export {templateCssHandler}
