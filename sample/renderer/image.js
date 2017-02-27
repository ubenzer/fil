import {fromGeneratedImagePath, idForPostAttachment, idToPath, isPathImage, urlToPath} from "../utils/id"
import {isExternalUrl, urlForPostAttachment} from "../utils/url"
import mime from "mime-types"
import path from "path"

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
  if (!image) { return [] }

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
    ext: path.extname(idToPath({id: image.id})).substr(1),
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

const imgTag = ({caption, classPartial, url}) =>
  `<img src="${url}" title="${caption}" alt="${caption}" ${classPartial}>`

const aTag = ({innerHtml, url}) =>
  `<a href="${url}" target="_blank">${innerHtml}</a>`

const renderAsPicture = ({availableSizes, caption, classPartial, renderAsLink, url}) => {
  const scaledImageUrl = calculateFallbackImageUrl({availableSizes, url})
  const img = imgTag({caption, classPartial, url: scaledImageUrl})

  const sources = calculateSourceTag({availableSizes})

  const picture = `
    <picture>
      ${sources.join("\n")}
      ${img}
    </picture>`

  if (renderAsLink) {
    return aTag({innerHtml: picture, url})
  }
  return picture
}

const renderAsImg = ({caption, classPartial, renderAsLink, url}) => {
  const img = imgTag({caption, classPartial, url})
  if (renderAsLink) {
    return aTag({innerHtml: img, url})
  }
  return img
}

export const markdownImageParser = (md, {imageMetas, scaledImageIds}) => {
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx]
    const srcIndex = token.attrIndex("src")
    const url = token.attrs[srcIndex][1]
    const rawCaption = token.content

    const caption = calculateCaption({rawCaption})
    const classPartial = calculateClassPartial({rawCaption})
    const renderAsLink = calculateRenderAsLink({rawCaption})

    if (isExternalUrl({url}) || !isPathImage({p: urlToPath({url})})) {
      return renderAsImg({caption, classPartial, renderAsLink, url})
    }

    const id = idForPostAttachment({type: "image", url})
    const availableSizes = availableSizesFor({id, imageMetas, scaledImageIds})

    if (availableSizes.length === 0) {
      throw new Error(`Image with url "${url}" not found.`)
    }

    return renderAsPicture({availableSizes, caption, classPartial, renderAsLink, url})
  }
}

