import {fromGeneratedImagePath, idForPostAttachment, idToPath} from "../utils/id"
import mime from "mime-types"
import path from "path"
import {urlForPostAttachment} from "../utils/url"

const FALLBACK_MAX_SIZE = 500

const calculateCaption = ({rawCaption}) => {
  const captionPairs = rawCaption.split("|")
  return captionPairs.pop()
}

const calculateRenderAsLink = ({rawCaption}) => {
  const captionPairs = rawCaption.split("|")
  return captionPairs.indexOf("nolink") === -1
}

const calculateClassPartial = ({rawCaption}) => {
  const captionPairs = rawCaption.split("|")
  captionPairs.pop()
  let className = captionPairs.indexOf("right") > -1 ? "right" : null
  className = captionPairs.indexOf("left") > -1 ? "left" : className
  return className ? `class="${className}"` : ""
}

const availableSizesFor = ({id, imageMetas: allImageMetas, scaledImageIds: allScaledImages}) => {
  const image = allImageMetas.filter((i) => i.id === id)[0]
  const imagePath = idToPath({id})

  const scaledImages = allScaledImages.reduce((acc, i) => {
    const p = idToPath({id: i})
    const ext = path.extname(p).substr(1)
    const {dimension, originalPath} = fromGeneratedImagePath({p})
    if (originalPath === imagePath) {
      return [...acc, {ext, id: i, width: dimension}]
    }
    return acc
  }, [])

  return [...scaledImages, {
    ext: image.meta.format,
    id: image.id,
    width: image.meta.width
  }]
}

const calculateSourceTag = ({availableSizes}) => {
  const imagesByMime = availableSizes.reduce((acc, as) => {
    const imageMime = mime.lookup(as.ext)
    const url = urlForPostAttachment({id: as.id})
    const mimeResources = [...(acc[imageMime] || []), `${url} ${as.width}w`]
    return {...acc, [imageMime]: mimeResources}
  }, {})

  return Object.keys(imagesByMime)
    .map((m) => {
      const mimeImages = imagesByMime[m]
      return `<source type="${m}" srcset="${mimeImages.join(", ")}">`
    })
}

const calculateFallbackImageUrl = ({availableSizes, url}) => {
  const originalMime = mime.lookup(path.extname(url).substr(1))
  const sortedImages = availableSizes
    .filter((as) => mime.lookup(as.ext) === originalMime)
    .sort((a, b) => a.width - b.width)

  let bestCandidate = sortedImages[0]

  sortedImages.forEach((si) => {
    if (si.width > bestCandidate.width && si.width < FALLBACK_MAX_SIZE) {
      bestCandidate = si
    }
  })

  return urlForPostAttachment({id: bestCandidate.id})
}

const renderImageHtml = ({availableSizes, caption, classPartial, renderAsLink, url}) => {
  const scaledImageUrl = calculateFallbackImageUrl({availableSizes, url})
  const img = `<img src="${scaledImageUrl}" title="${caption}" alt="${caption}" ${classPartial}>`

  const sources = calculateSourceTag({availableSizes})

  const picture = `
    <picture>
      ${sources.join("\n")}
      ${img}
    </picture>`

  if (renderAsLink) {
    return `<a href="${url}" target="_blank">${picture}</a>`
  }
  return picture
}

export const markdownImageParser = (md, {imageMetas, scaledImageIds}) => {
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx]
    const srcIndex = token.attrIndex("src")
    const url = token.attrs[srcIndex][1]
    const rawCaption = token.content

    const id = idForPostAttachment({type: "image", url})
    const availableSizes = availableSizesFor({id, imageMetas, scaledImageIds})
    const caption = calculateCaption({rawCaption})
    const classPartial = calculateClassPartial({rawCaption})
    const renderAsLink = calculateRenderAsLink({rawCaption})
    return renderImageHtml({availableSizes, caption, classPartial, renderAsLink, url})
  }
}

