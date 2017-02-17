import {DefaultHeader} from "./default-header"
import Helmet from "react-helmet"
import React from "react"

const template = ({title, htmlContent}) =>
  <div className="blog-post">
    <DefaultHeader />
    <Helmet title="bd" />

    <h1>{title}</h1>
    <div dangerouslySetInnerHTML={{__html: htmlContent}} />
  </div>

template.propTypes = {
  htmlContent: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired
}

export {template}
