import {defaultTitle, themeColor, titleTemplate} from "../../config"
import Helmet from "react-helmet"
import React from "react"
import {urlForTemplateStylus} from "../../utils/url"

const DefaultHeader = () =>
  <Helmet
    defaultTitle={defaultTitle}
    htmlAttributes={{lang: "tr"}}
    link={[
      {href: urlForTemplateStylus(), media: "screen", rel: "stylesheet", type: "text/css"}
    ]}
    meta={[
      {content: "utf-8", name: "charset"},
      {content: "width=device-width, initial-scale=1.0", name: "viewport"},
      {content: themeColor, name: "theme-color"}
    ]}
    script={[
      {src: "http://include.com/pathtojs.js", type: "text/javascript"}
    ]}
    titleTemplate={titleTemplate}
  />

export {DefaultHeader}
