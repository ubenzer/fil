import {postSubfolder, templateSubfolder} from "../index"
import {idToPath} from "./id"
import path from "path"
import replaceall from "replaceall"
import slug from "larvitslugify"

const urlForTemplateCss = ({id}) => {
  const p = idToPath({id})
  const url = slug(replaceall(path.sep, "/", p), {save: ["/", "."]})
  return `/${url}`
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

export {urlForTemplateCss, urlForPost, urlForPostAttachment, urlForTemplateStylus, isExternalUrl}
