import React from "react";

const template = ({content}) => (
 <html>
  <head>
    <title>Hello</title>
  </head>
  <body>
    <h1>Hello</h1>
    <div dangerouslySetInnerHTML={{__html: content}} />
  </body>
 </html>
);
export {template};
