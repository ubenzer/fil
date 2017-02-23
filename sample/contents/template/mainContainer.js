import {DefaultHeader} from "./defaultHeader"
import React from "react"
import {urlForTemplateCss} from "../../utils/url"

const MainContainer = ({children}) =>
  <div className="main-container">
    <DefaultHeader
      link={[
        {
          href: urlForTemplateCss({id: "template/mainContainer.css"}),
          media: "screen",
          rel: "stylesheet",
          type: "text/css"
        }
      ]}
    />
    <div className="main-content">
      {children}
    </div>
  </div>

MainContainer.propTypes = {children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired}

export {MainContainer}
