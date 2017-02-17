import Helmet from "react-helmet"
import ReactDOMServer from "react-dom/server"

const regexp = / data-react-helmet="true"/g
const render = ({jsx}) => {
  const renderedPage = ReactDOMServer.renderToStaticMarkup(jsx)
  const head = Helmet.rewind()

  // https://github.com/nfl/react-helmet/issues/79#issuecomment-265099060
  const attr = head.htmlAttributes.toString()
  const title = head.title.toString().replace(regexp, "")
  const link = head.link.toString().replace(regexp, "")
  const meta = head.meta.toString().replace(regexp, "")

  return `
    <!doctype html>
    <html ${attr}>
      <head>
        ${title}
        ${meta}
        ${link}
      </head>
      <body>
        ${renderedPage}
      </body>
    </html>
  `
}

export {render}
