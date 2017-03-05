import React from "react"

export const blogPostPropType = React.PropTypes.shape({
  createDate: React.PropTypes.instanceOf(Date).isRequired,
  htmlContent: React.PropTypes.string.isRequired,
  htmlExcerpt: React.PropTypes.string.isRequired,
  id: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired
})
