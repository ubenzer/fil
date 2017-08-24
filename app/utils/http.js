import mime from 'mime-types'
import path from 'path'

const headersFor = ({url}) => {
  let normalizedUrl = url
  if (url.endsWith('/')) {
    normalizedUrl = `${url}index.html`
  }

  return {'Content-Type': mime.contentType(path.extname(normalizedUrl)) || 'application/octet-stream'}
}

export {headersFor}
