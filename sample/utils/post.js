import frontMatter from "front-matter"
import {markdownImageParser} from "../renderer/image"
import markdownIt from "markdown-it"
import markdownItReplaceLink from "markdown-it-replace-link"
import {postIdToImageId} from "./id"
import {urlForPostAttachment} from "./url"

const extractTitleFromMarkdown = ({markdown}) => {
  const lines = markdown.split("\n")

  while (lines.length > 0 && lines[0].trim().length === 0) {
    lines.shift()
  }
  if (lines.length === 0 || lines[0].length < 3 || lines[0].substr(0, 2) !== "# ") {
    return {
      content: lines.join("\n"),
      title: null
    }
  }
  const titleLine = lines.shift()

  return {
    content: lines.join("\n"),
    title: titleLine.substr(2)
  }
}

const calculateHtmlContent = ({id, markdownContent}) => {
  // noinspection JSUnusedGlobalSymbols
  const md = markdownIt({
    replaceLink: (link) => {
      const imageId = postIdToImageId({imageRelativeUrl: link, postId: id})
      return urlForPostAttachment({id: imageId})
    }
  })
    .use(markdownItReplaceLink)
    .use(markdownImageParser)

  const separatedContent = markdownContent.split("---more---")

  if (separatedContent.length > 1) {
    const htmlExcerpt = md.render(separatedContent[0])
    const htmlContent = md.render(separatedContent.join("\n\n"))

    return {
      htmlContent,
      htmlExcerpt
    }
  }

  const htmlContent = md.render(markdownContent)

  return {
    htmlContent,
    htmlExcerpt: htmlContent
  }
}

const rawContentToPostObject = async ({id, rawFileContent}) => {
  const doc = frontMatter(rawFileContent)
  const createDate = doc.attributes.created
  const editDate = doc.attributes.edited instanceof Date ? doc.attributes.edited : new Date(createDate)
  const taxonomy = doc.attributes.taxonomy instanceof Object ? doc.attributes.taxonomy : {}
  const extractedTitleObject = extractTitleFromMarkdown({markdown: doc.body})

  const markdownContent = extractedTitleObject.content
  const title = typeof doc.attributes.title === "string" ? doc.attributes.title : extractedTitleObject.title
  const {htmlContent, htmlExcerpt} = calculateHtmlContent({id, markdownContent})

  return {
    createDate,
    editDate,
    htmlContent,
    htmlExcerpt,
    taxonomy,
    title
  }
}

export {rawContentToPostObject, extractTitleFromMarkdown}
