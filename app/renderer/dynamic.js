import browserSync from 'browser-sync'
import {headersFor} from '../utils/http'
import http from 'http'
import {translateError} from '../utils/misc'

/* eslint-disable no-console */
export class DynamicRenderer {
  constructor({project}) {
    this._project = project
  }

  async handleRequest(request, response) {
    const url = request.url

    if (url === '/?urlList') {
      const urlInfo = await this._project.handledUrls()
      const handledUrlList = urlInfo.urls.map(({url: u}) => u)
      DynamicRenderer.renderUrlList({handledUrlList, response})
      return
    }

    const generatedPage = await this._project.handle({url}).catch(translateError)

    if (generatedPage instanceof Error) {
      if (generatedPage.message === '404') {
        DynamicRenderer.render404({response})
      } else {
        DynamicRenderer.render500({error: generatedPage, response})
      }
      return
    }
    const {body} = generatedPage

    const headers = headersFor({url})

    response.writeHead(200, headers)
    response.end(body)
  }

  async render() {
    return new Promise((resolve, reject) => {
      http.createServer(this.handleRequest.bind(this))
        .listen(4000, (err) => {
          if (err) {
            reject(err)
            return
          }
          const bs = browserSync.create()

          bs.init({
            open: false,
            proxy: 'localhost:4000'
          })
          this._project.watcher$()
            .subscribe(() => {
              bs.reload()
            })
          resolve()
        })
    })
  }
}
DynamicRenderer.render404 = ({response}) => {
  response.writeHead(404)
  response.end('404 - Nein!')
}
DynamicRenderer.render500 = ({error, response}) => {
  console.error(error)
  response.writeHead(500)
  response.end('<head></head><body>500 - Check console</body>')
}
DynamicRenderer.renderUrlList = ({handledUrlList, response}) => {
  const body = [`${handledUrlList.length} urls`, ...handledUrlList].join('\n')

  response.writeHead(200, {'Content-Type': 'text/plain'})
  response.write(body)
  response.end()
}
