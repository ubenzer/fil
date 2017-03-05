import {dateFormat, locale} from "../../../config"
import React from "react"
import {blogPostPropType} from "../propTypes"
import moment from "moment"
import {urlForPost} from "../../../utils/url"

const BlogPost = ({post}) =>
  <div className="card">
    <div className="card__contents blog-post">
      <div className="blog-post__date">
        {moment(post.createDate).locale(locale)
          .format(dateFormat)}
      </div>
      <h1 className="blog-post__title">
        <a href={urlForPost({id: post.id})}>{post.title}</a>
      </h1>
      <div className="blog-post__content"
        dangerouslySetInnerHTML={{__html: post.htmlContent}}
      />
    </div>
  </div>

BlogPost.propTypes = {post: blogPostPropType.isRequired}

export {BlogPost}
