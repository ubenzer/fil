import React from "react"

const BlogPost = ({title, htmlContent}) =>
  <div className="card">
    <div className="card__contents blog-post">
      <h1 className="blog-post__title">{title}</h1>
      <div className="blog-post__content"
        dangerouslySetInnerHTML={{__html: htmlContent}}
      />
    </div>
  </div>

BlogPost.propTypes = {
  htmlContent: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired
}

export {BlogPost}
