class RouteManager {
  constructor({project}) {
    this._project = project
    // eslint-disable-next-line no-underscore-dangle
    this._renderers = project._project.renderers
  }

  async handle({url}) {
    const {duplicates, urls} = await this.handledUrls()
    if (Object.keys(duplicates).length > 0) {
      throw new Error(RouteManager.generateDuplicateUrlErrorText(duplicates))
    }

    const urlData = urls.find((uData) => uData.url === url)

    if (!urlData) {
      throw new Error('404')
    }

    const {handler, data} = urlData

    const {body} = await this._renderers[handler].render({data, querier: this._project.querier(), url})
    return {body}
  }

  async handledUrls() {
    const handledUrlsPerHandler = await this._handledUrlsPerHandler()

    const urlMap = {}
    const duplicateUrls = {}

    Object.keys(handledUrlsPerHandler)
      .forEach((handlerId) => {
        const handledUrls = handledUrlsPerHandler[handlerId]
        handledUrls.forEach(({url, data}) => {
          if (typeof urlMap[url] === 'undefined') {
            urlMap[url] = {
              data,
              handler: [handlerId]
            }
          } else {
            urlMap[url].handler.push(handlerId)
            duplicateUrls[url] = {handler: [...urlMap[url].handler]}
          }
        })
      })

    return {
      duplicates: duplicateUrls,
      urls: Object.keys(urlMap).map((url) => {
        const data = urlMap[url].data
        const handler = urlMap[url].handler[0]
        return {data, handler, url}
      })
    }
  }

  async handleAll({urlProcessFn}) {
    const urlListPerHandler = await this._handledUrlsPerHandler()

    for (const handlerId of Object.keys(urlListPerHandler)) {
      for (const {url, data} of urlListPerHandler[handlerId]) {
        const {body} = await this._project.valueOf({ // eslint-disable-line no-await-in-loop
          _data: data,
          id: url,
          type: handlerId
        })
        await urlProcessFn({body, handlerId, url}) // eslint-disable-line no-await-in-loop
      }
    }
  }

  /* Private operations */
  async _handledUrlsPerHandler() {
    const contentTypes = Object.keys(this._renderers) // eslint-disable-line no-underscore-dangle
    const urlListPerHandler = await Promise.all(contentTypes.map((handlerId) =>
      this._renderers[handlerId].urlList({
        querier: this._project.querier()
      }))) // eslint-disable-line no-underscore-dangle

    return contentTypes
      .reduce((acc, handlerId, index) => ({[handlerId]: urlListPerHandler[index], ...acc}), {})
  }
}

RouteManager.generateDuplicateUrlErrorText = (duplicates) => {
  let string = "Some url's are handled by more than one handler. Please fix duplicated handling and try again:\n\n"
  Object.keys(duplicates)
    .forEach((url) => {
      const handlers = duplicates[url].handler
      string += `${url} is handled by ${handlers.join(', ')}\n`
    })
  return string
}

module.exports = {RouteManager}
