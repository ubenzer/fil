import ReactDOMServer from 'react-dom/server';
import Helmet from "react-helmet";

const render = ({jsx}) => {
  const renderedPage = ReactDOMServer.renderToStaticMarkup(jsx);
  const head = Helmet.rewind();
  return `
    <!doctype html>
    <html ${head.htmlAttributes.toString()}>
      <head>
        ${head.title.toString()}
        ${head.meta.toString()}
        ${head.link.toString()}
      </head>
      <body>
        ${renderedPage}
      </body>
    </html>
  `;
};

export {render};
