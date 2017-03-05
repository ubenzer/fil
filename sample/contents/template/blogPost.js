import {BlogPost} from "./components/BlogPost"
import Helmet from "react-helmet"
import {MainContainer} from "./mainContainer"
import React from "react"
import {blogPostPropType} from "./propTypes"

const template = ({post}) =>
  <MainContainer>
    <Helmet title={post.title} />
    <BlogPost post={post} />
  </MainContainer>


template.propTypes = {post: blogPostPropType.isRequired}

export default template
