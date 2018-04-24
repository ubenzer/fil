const Gauge = require('gauge')
const {RouteManager} = require('../routeManager')
const fs = require('fs-extra')
const path = require('path')

class StaticRenderer {
  constructor({project}) {
    this._project = project
    this._gauge = new Gauge()
  }

  async render() {
    this._gauge.show('Getting url list...', 0)
    const {duplicates, urls} = await this._project.handledUrls()

    if (Object.keys(duplicates).length > 0) {
      throw new Error(RouteManager.generateDuplicateUrlErrorText(duplicates))
    }

    const totalCount = urls.length

    let idx = 0

    await this._project.handleAll({
      urlProcessFn: ({url, body, handlerId}) => {
        idx++
        this._gauge.show(handlerId, idx / totalCount)
        this._gauge.pulse(url)

        let pathToWrite = path.join(this._project.outPath(), url)

        if (url.endsWith('/')) {
          pathToWrite = path.join(pathToWrite, 'index.html')
        }

        return fs.outputFile(pathToWrite, body)
      }
    })

    this._gauge.hide()
  }
}

module.exports = {StaticRenderer}
