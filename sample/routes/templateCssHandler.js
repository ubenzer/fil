import {defaultHeadersFor} from "../utils/http"
import {urlForTemplateCss} from "../utils/url"
import {urlToPath} from "../utils/id"

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
    return cssFiles.map(urlForTemplateCss)
  },
  async handlesArguments({project}) {
    const {children: cssFiles} = await project.metaOf({id: "csses"})

    return {cssFiles}
  }
}
export {templateCssHandler}
