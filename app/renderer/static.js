import Gauge from 'gauge'
import fs from 'fs-extra'
import path from 'path'

export class StaticRenderer {
  constructor({project}) {
    this._project = project
    this._gauge = new Gauge()
  }

  async render() {
    this._gauge.show('Getting url list...', 0)
    const {duplicates, items} = await this._project.checkForDuplicateUrls()

    if (Object.keys(duplicates).length > 0) {
      throw new Error(StaticRenderer.generateDuplicateUrlErrorText(duplicates))
    }

    const totalCount = items.length

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
StaticRenderer.generateDuplicateUrlErrorText = (duplicates) => {
  let string = "Some url's are handled by more than one handler. Please fix duplicated handling and try again:\n\n"
  Object.keys(duplicates)
    .forEach((url) => {
      const handlers = duplicates[url].handler
      string += `${url} is handled by ${handlers.join(', ')}\n`
    })
  return string
}
