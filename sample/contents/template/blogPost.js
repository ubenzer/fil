import Helmet from "react-helmet"
import {MainContainer} from "./mainCotainer"
import React from "react"

const template = ({title, htmlContent}) =>
  <MainContainer>
    <Helmet title={title} />
    <div className="blog-post">
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{__html: htmlContent}} />
    </div>
  </MainContainer>


template.propTypes = {
  htmlContent: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired
}

export {template}
