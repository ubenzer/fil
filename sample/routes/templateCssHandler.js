import {defaultHeadersFor} from "../utils/http"
import {idForTemplateCss} from "../utils/id"
import {urlForTemplateCss} from "../utils/url"

const templateCssHandler = {
  async handle({project, url}) {
    const id = idForTemplateCss({url})
    const value = await project.valueOf({id})

    return {
      body: value.content,
      headers: defaultHeadersFor({url})
    }
  },
  async handles({cssFiles}) {
    return cssFiles.map((id) => urlForTemplateCss({id}))
  },
  async handlesArguments({project}) {
    const {children: cssFiles} = await project.metaOf({id: "csses"})

    return {cssFiles}
  }
}
export {templateCssHandler}
