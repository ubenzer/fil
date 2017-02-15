import {IMAGE_EXTENSIONS} from "./image"
import path from "path"
import replace from "replaceall"

const scaledImagePostfix = ".scaled"

const fromGeneratedImagePath = ({p}) => {
  const fileExtension = path.extname(p)
  const fileName = path.basename(p, fileExtension)
  const fileNamePieces = fileName.split(scaledImagePostfix)

  if (fileNamePieces.length < 2) { return null }

  const afterScaledImagePostFix = fileNamePieces.pop()
  const [, ext, dimensionStr] = afterScaledImagePostFix.split("-")
  const dimension = parseInt(dimensionStr, 10)

  const originalPath = path.join(p, "..", `${fileNamePieces.join(scaledImagePostfix)}.${ext}`)

  return {dimension, ext, originalPath}
}

const toGeneratedImagePath = ({originalPath, dimension, ext}) => {
  const fileExtension = path.extname(originalPath)
  const fileName = path.basename(originalPath, fileExtension)
  const normalizedExtension = ext ? `.${ext}` : fileExtension

  // / a/b/c.jpg becomes a/b/c.scaled-jpg-500.webp
  const outFileName = `${fileName}${scaledImagePostfix}-${fileExtension.substr(1)}-${dimension}${normalizedExtension}`

  return path.join(originalPath, "..", outFileName)
}

const idToType = ({id}) => id.split("@")[0]

const idToPath = ({id}) => replace("/", path.sep, id.substr(id.indexOf("@") + 1))

const pathToIdPart = ({p}) => replace(path.sep, "/", p)

const urlToPath = ({url}) => {
  if (url.length === 0) { return {p: ""} }
  if (url[0] === "/") {
    url = url.substr(1) // eslint-disable-line no-param-reassign
  }

  return replace("/", path.sep, url)
}

const isPathImage = ({p}) => IMAGE_EXTENSIONS.filter((ie) => path.extname(p) === `.${ie}`).length > 0

const isGeneratedImagePath = ({p}) => {
  try {
    const {dimension, originalPath, ext} = fromGeneratedImagePath({p})

    return Boolean(originalPath && dimension && ext)
  } catch (e) {
    return false
  }
}

export {idToType, idToPath, pathToIdPart, urlToPath, isGeneratedImagePath,
  fromGeneratedImagePath, toGeneratedImagePath, isPathImage}
