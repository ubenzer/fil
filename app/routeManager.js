export class RouteManager {
  constructor({project}) {
    this._project = project
  }

  async handledUrlsPerHandler() {
    const contentTypes = Object.keys(this._project._project.routeHandlers) // eslint-disable-line no-underscore-dangle
    const urlListPerHandler = await Promise.all(contentTypes.map((handlerId) => this._handledUrlListFor({handlerId})))

    return contentTypes
      .reduce((acc, handlerId, index) => ({[handlerId]: urlListPerHandler[index], ...acc}), {})
  }

  async handledUrls() {
    const urlListPerHandler = await this.handledUrlsPerHandler()
    return Object.keys(urlListPerHandler)
      .reduce((acc, handlerId) => [...urlListPerHandler[handlerId], ...acc], [])
  }

  async handle({url}) {
    const handledUrlsPerHandler = await this.handledUrlsPerHandler()
    const handlersIdsForUrl = Object.keys(handledUrlsPerHandler)
      .filter((handlerId) => handledUrlsPerHandler[handlerId].indexOf(url) > -1)

    if (handlersIdsForUrl.length !== 1) {
      throw new Error(`"${url}" is handled by ${handlersIdsForUrl.length} handlers: 
        ${handlersIdsForUrl.join(',')}`)
    }

    const {body} = await this._project.valueOf({id: url, type: handlersIdsForUrl[0]})
    return {body}
  }

  /* Private operations */
  async _handledUrlListFor({handlerId}) {
    const {children} = await this._project.metaOf({id: null, type: handlerId})
    return children.map(({id}) => id)
  }
}
