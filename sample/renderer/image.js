
export const markdownImageParser = (md) => {
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx]
    const srcIndex = token.attrIndex("src")
    const url = token.attrs[srcIndex][1]
    const rawCaption = token.content
    const captionPairs = rawCaption.split("|")
    const caption = captionPairs.pop()

    let className = captionPairs.indexOf("right") > -1 ? "right" : null
    className = captionPairs.indexOf("left") > -1 ? "left" : className

    const renderAsLink = captionPairs.indexOf("nolink") === -1

    const imageHtml = `<img src="${url}" alt="${caption}" ${className ? `class="${className}"` : ""}>`

    if (!renderAsLink) {
      return imageHtml
    }

    return `<a href="${url}" target="_blank">${imageHtml}</a>`
  }
}
