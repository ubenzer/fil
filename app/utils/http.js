const mime = require('mime-types')
const path = require('path')

const headersFor = ({url}) => {
  let normalizedUrl = url
  if (url.endsWith('/')) {
    normalizedUrl = `${url}index.html`
  }

  return {'Content-Type': mime.contentType(path.extname(normalizedUrl)) || 'application/octet-stream'}
}

module.exports = {headersFor}
