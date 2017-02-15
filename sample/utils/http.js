import * as mime from "mime-types"
import * as path from "path"

const defaultHeadersFor = ({url, defaultContentType}) => (
  {"Content-Type": mime.contentType(path.extname(url)) || defaultContentType || "application/octet-stream"}
)

export {defaultHeadersFor}
