import sharp from "sharp";
import * as path from "path";

sharp.concurrency(8);

const IMAGE_EXTENSIONS = ["jpg", "png", "webp"]; // gif is not supported

const extensionToSharpFormatMap = {
  JPEG: "jpeg",
  JPG: "jpeg",
  jpeg: "jpeg",
  jpg: "jpeg",
  PNG: "png",
  png: "png",
  WEBP: "webp",
  webp: "webp"
};

const extToSharpFormat = ({ext}) => (extensionToSharpFormatMap[ext]);

const resizeByWidth = async ({src, width, ext}) => (
  sharp(src)
    .resize(width, null)
    .toFormat(extToSharpFormat({ext}), {quality: 80})
    .toBuffer()
    .catch((e) => {
      // for some reason promises rejected via sharp library doesn't have the stack trace. So I catch and rethrow them.
      throw new Error(`${src} - ${e.message}`);
    })
);

const compress = async ({src}) => {
  try {
    return sharp(src)
      .toFormat(extToSharpFormat({ext: path.extname(src).substr(1)}), {quality: 80})
      .toBuffer()
      .catch((e) => {
        // for some reason promises rejected via sharp library doesn't have the stack trace. So I catch and rethrow them.
        throw new Error(`${src} - ${e.message}`);
      })
  } catch (e) {
    return Promise.reject(new Error(`${src} - ${e.message}`));
  }
};

const meta = async ({src}) => (
  sharp(src)
    .metadata()
    .then(({format, width, height}) => ({format, width, height}))
    .catch((e) => {
      // for some reason promises rejected via sharp library doesn't have the stack trace. So I catch and rethrow them.
      throw new Error(`${src} - ${e.message}`);
    })
);

export {resizeByWidth, meta, compress, IMAGE_EXTENSIONS};