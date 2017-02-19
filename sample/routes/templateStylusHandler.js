import {defaultHeadersFor} from "../utils/http"
import {urlForTemplateStylus} from "../utils/url"

const templateStylusHandler = {
  async handle({project, url}) {
    const value = await project.valueOf({id: "stylus"})

    return {
      body: value.content,
      headers: defaultHeadersFor({url})
    }
  },
  handles: async () => [urlForTemplateStylus()]
}
export {templateStylusHandler}
