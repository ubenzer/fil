import path from "path"
import sharp from "sharp"

// Gif is not supported
const IMAGE_EXTENSIONS = ["jpg", "png", "webp"]

const extensionToSharpFormatMap = {
  JPEG: "jpeg",
  JPG: "jpeg",
  PNG: "png",
  WEBP: "webp",
  jpeg: "jpeg",
  jpg: "jpeg",
  png: "png",
  webp: "webp"
}

const extToSharpFormat = ({ext}) => extensionToSharpFormatMap[ext]

const resizeByWidth = async ({src, width, ext}) =>
  sharp(src)
    .resize(width, null)
    .toFormat(extToSharpFormat({ext}), {quality: 80})
    .toBuffer()
    .catch((e) => {
      // For some reason promises rejected via sharp library doesn't have the stack trace. So I catch and rethrow them.
      throw new Error(`${src} - ${e.message}`)
    })


const compress = async ({src}) => {
  try {
    return sharp(src)
      .toFormat(extToSharpFormat({ext: path.extname(src).substr(1)}), {quality: 80})
      .toBuffer()
      .catch((e) => {
        // For some reason promises rejected via sharp library doesn't have the stack trace. So I catch/rethrow them.
        throw new Error(`${src} - ${e.message}`)
      })
  } catch (e) {
    return Promise.reject(new Error(`${src} - ${e.message}`))
  }
}

const meta = async ({src}) =>
  sharp(src)
    .metadata()
    .then(({format, width, height}) => ({
      format,
      height,
      width
    }))
    .catch((e) => {
      // For some reason promises rejected via sharp library doesn't have the stack trace. So I catch and rethrow them.
      throw new Error(`${src} - ${e.message}`)
    })

export {resizeByWidth, meta, compress, IMAGE_EXTENSIONS}
