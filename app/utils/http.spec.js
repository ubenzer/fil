const {headersFor} = require('./http')
const {it} = require('jasmine-promise-wrapper')

describe('headersFor', () => {
  const testData = [
    ['/test.html', 'text/html; charset=utf-8'],
    ['/a.jpg', 'image/jpeg'],
    ['/', 'text/html; charset=utf-8'],
    ['/test/123/', 'text/html; charset=utf-8'],
    ['/app.exe', 'application/x-msdos-program'],
    ['/app.zip', 'application/zip'],
    ['/some.randomextension', 'application/octet-stream']
  ]
  it('returns the content type header back for a url', () => {
    testData.forEach((td) => {
      const headers = headersFor(td[0])
      expect(headers['Content-Type']).toEqual(td[1])
    })
  })
})
