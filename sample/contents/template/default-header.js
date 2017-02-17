import {defaultTitle, titleTemplate} from "../../config"
import Helmet from "react-helmet"
import React from "react"
import {urlForTemplateCss} from "../../utils/url"

const DefaultHeader = () =>
  <Helmet
    defaultTitle={defaultTitle}
    htmlAttributes={{lang: "tr"}}
    link={[
      {href: urlForTemplateCss({id: "template/blog-post.css"}), media: "screen", rel: "stylesheet", type: "text/css"}
    ]}
    meta={[
      {content: "application", name: "description"}
    ]}
    script={[
      {src: "http://include.com/pathtojs.js", type: "text/javascript"}
    ]}
    titleTemplate={titleTemplate}
  />

export {DefaultHeader}
