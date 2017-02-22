import {BlogPost} from "./components/BlogPost"
import Helmet from "react-helmet"
import {MainContainer} from "./mainContainer"
import React from "react"

const template = ({title, htmlContent}) =>
  <MainContainer>
    <Helmet title={title} />
    <BlogPost
      htmlContent={htmlContent}
      title={title}
    />
  </MainContainer>


template.propTypes = {
  htmlContent: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired
}

export default template
