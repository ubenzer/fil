import Gauge from 'gauge'
import fs from 'fs-extra'
import path from 'path'
import {translateError} from '../utils/misc'

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
    let pathToWrite = path.join(this._project.outPath(), url)

    if (url.endsWith('/')) {
      pathToWrite = path.join(pathToWrite, 'index.html')
    }

    if (this._outputHeaders) {
      const headersFile = `${pathToWrite}.headers`
      // noinspection JSUnresolvedFunction
      return Promise.all([
        fs.outputFil(pathToWrite, body),
        fs.outputJson(headersFile, headers)
      ])
    }
    return fs.outputFile(pathToWrite, body)
  }
}
