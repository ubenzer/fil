import {BlogPost} from "./components/BlogPost"
import Helmet from "react-helmet"
import {MainContainer} from "./mainContainer"
import React from "react"
import {blogPostPropType} from "./propTypes"

const template = ({pageNumber, posts}) =>
  <MainContainer>
    <Helmet title={pageNumber.toString()} />
    <div>
      {
        posts.map((post) =>
          <BlogPost key={post.id}
            post={post}
          />
        )
      }
    </div>
  </MainContainer>


template.propTypes = {
  pageNumber: React.PropTypes.number.isRequired,
  posts: React.PropTypes.arrayOf(blogPostPropType).isRequired
}

export default template
