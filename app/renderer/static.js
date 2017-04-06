import {fsPromise, translateError} from '../utils/misc'
import Gauge from 'gauge'
import path from 'path'

export class StaticRenderer {
  constructor({project, outputHeaders}) {
    this._project = project
    this._outputHeaders = outputHeaders
    this._gauge = new Gauge()
  }

  async render() {
    const urlListPerHandler = await this._project.handledUrlsPerHandler()
    const totalCount = Object.keys(urlListPerHandler)
      .reduce((acc, handlerId) => acc + urlListPerHandler[handlerId].length, 0)

    let idx = 0

    for (const handlerId of Object.keys(urlListPerHandler)) {
      for (const url of urlListPerHandler[handlerId]) {
        this._gauge.show(handlerId, idx / totalCount)
        this._gauge.pulse(url)

        const {headers, body} = await this._project.handle({url}) // eslint-disable-line no-await-in-loop

        await this._renderSingle({body, headers, url}).catch(translateError) // eslint-disable-line no-await-in-loop
        idx++
      }
    }
    this._gauge.hide()
  }

  async _renderSingle({url, headers, body}) {
    const ext = path.extname(url)
    let pathToWrite = path.join(this._project.outPath(), url)

    if (ext.length === 0 && headers['Content-Type'].indexOf('text/html') > -1) {
      pathToWrite = path.join(pathToWrite, 'index.html')
    }

    if (this._outputHeaders) {
      const headersFile = `${pathToWrite}.headers`
      // noinspection JSUnresolvedFunction
      return Promise.all([
        fsPromise.outputFileAsync(pathToWrite, body),
        fsPromise.outputJsonAsync(headersFile, headers)
      ])
    }
    return fsPromise.outputFileAsync(pathToWrite, body)
  }
}
