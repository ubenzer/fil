import Helmet from "react-helmet"
import React from "react"
import {urlForTemplateCss} from "../../utils/url"
import {DefaultHeader} from "./default-header"

const template = ({content}) =>
  <div className="blog-post">
    <DefaultHeader />
    <Helmet
      title="bd"
    />

    <div dangerouslySetInnerHTML={{__html: content}} />
  </div>

template.propTypes = {content: React.PropTypes.string.isRequired}

export {template}
