import {postSubfolder, staticAssetsSubfolder, templateSubfolder} from "../index"
import {idToPath} from "./id"
import path from "path"
import replaceall from "replaceall"
import slug from "larvitslugify"

const urlForTemplateCss = ({id}) => replaceall(path.sep, "/", idToPath({id}))

const urlForStaticAsset = ({id}) => {
  // we get rid of post part of id (--->/static<---/robots.txt)
  const p = idToPath({id}).substr(staticAssetsSubfolder.length + 1)
  return replaceall(path.sep, "/", p)
}

const urlForTemplateStylus = () => {
  const p = replaceall(path.sep, "/", templateSubfolder)
  return `/${p}/ui.css`
}

const urlForPost = ({id}) => {
  const p = idToPath({id})
  return slug(replaceall(path.sep, "/", p), {save: ["/"]})
}

const urlForPostAttachment = ({id}) => {
  // we get rid of post part of id (--->/post<---/2010/05/finaller/finaller-500.scaled.webp)
  const p = idToPath({id}).substr(postSubfolder.length + 1)
  return slug(replaceall(path.sep, "/", p), {save: ["/", "."]})
}

const isExternalUrl = ({url}) => url.includes("://") || url.startsWith("//")

export {urlForTemplateCss, urlForPost, urlForPostAttachment, urlForTemplateStylus, isExternalUrl, urlForStaticAsset}
