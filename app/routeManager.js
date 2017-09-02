export class RouteManager {
  constructor({project}) {
    this._project = project
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

    const {body} = await this._project.valueOf({_data: data, id: url, type: handler})
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
          data,
          id: url,
          type: handlerId
        })
        await urlProcessFn({body, handlerId, url}) // eslint-disable-line no-await-in-loop
      }
    }
  }

  /* Private operations */
  async _handledUrlListFor({handlerId}) {
    const {children} = await this._project.metaOf({id: null, type: handlerId})
    return children.map(({_data, id}) => ({data: _data, url: id}))
  }

  async _handledUrlsPerHandler() {
    const contentTypes = Object.keys(this._project._project.routeHandlers) // eslint-disable-line no-underscore-dangle
    const urlListPerHandler = await Promise.all(contentTypes.map((handlerId) => this._handledUrlListFor({handlerId})))

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
