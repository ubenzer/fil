import Helmet from "react-helmet"
import React from "react"

const template = ({content}) =>
  <div className="blog-post">
    <Helmet
      base={{href: "http://mysite.com/", target: "_blank"}}
      defaultTitle="My Default Title"
      htmlAttributes={{lang: "en"}}
      link={[
        {href: "http://mysite.com/example", rel: "canonical"}
      ]}
      meta={[
        {content: "Helmet application", name: "description"}
      ]}
      script={[
        {src: "http://include.com/pathtojs.js", type: "text/javascript"}
      ]}
      title="My Title"
      titleAttributes={{itemprop: "name", lang: "en"}}
      titleTemplate="MySite.com - %s"
    />

    <div dangerouslySetInnerHTML={{__html: content}} />
  </div>

template.propTypes = {content: React.PropTypes.string.isRequired}

export {template}
