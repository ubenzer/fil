import sharp from "sharp";

const IMAGE_EXTENSIONS = ["jpg", "png", "webp"]; // gif is not supported

const resizeByWidth = ({src, width, ext}) => (
  sharp(src)
    .resize(width, null)
    .toFormat({id: ext, quality: 80})
    .toBuffer()
);

const compress = ({src}) => (
  sharp(src)
    .toFormat({quality: 80})
    .toBuffer()
);

const meta = ({src}) => (
  sharp(src)
    .metadata()
    .then(({format, width, height}) => ({format, width, height}))
);

export {resizeByWidth, meta, compress, IMAGE_EXTENSIONS};
