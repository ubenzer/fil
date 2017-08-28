import Gauge from 'gauge'
import fs from 'fs-extra'
import path from 'path'
import {translateError} from '../utils/misc'

export class StaticRenderer {
  constructor({project}) {
    this._project = project
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

        const {body} = await this._project.handle({url}) // eslint-disable-line no-await-in-loop

        await this._renderSingle({body, url}).catch(translateError) // eslint-disable-line no-await-in-loop
        idx++
      }
    }
    this._gauge.hide()
  }

  async _renderSingle({url, body}) {
    let pathToWrite = path.join(this._project.outPath(), url)

    if (url.endsWith('/')) {
      pathToWrite = path.join(pathToWrite, 'index.html')
    }

    return fs.outputFile(pathToWrite, body)
  }
}
