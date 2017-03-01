import {BlogPost} from "./components/BlogPost"
import Helmet from "react-helmet"
import {MainContainer} from "./mainContainer"
import React from "react"

const template = ({pageNumber, posts}) =>
  <MainContainer>
    <Helmet title={(pageNumber + 1).toString()} />
    {
      posts.map((post) =>
        <BlogPost
          htmlContent={post.htmlExcerpt}
          key={post.id}
          title={post.title}
        />
      )
    }
  </MainContainer>


template.propTypes = {
  pageNumber: React.PropTypes.number.isRequired,
  posts: React.PropTypes.arrayOf(React.PropTypes.shape({
    htmlExcerpt: React.PropTypes.string.isRequired,
    id: React.PropTypes.string.isRequired,
    title: React.PropTypes.string.isRequired
  })).isRequired
}

export default template
