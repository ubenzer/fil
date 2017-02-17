import {idToPath} from "./id"
import path from "path"
import replaceall from "replaceall"
import slug from "larvitslugify"

const urlForTemplateCss = ({id}) => {
  const p = idToPath({id})
  const url = slug(replaceall(path.sep, "/", p), {save: ["/", "."]})
  return `/${url}`
}

export {urlForTemplateCss}
