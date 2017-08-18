import {readObject, writeObject} from './utils/cache'

export class RouteManager {
  constructor({project}) {
    this._project = project
    this._cache = {handlers: {}}
  }

  async handledUrlsPerHandler() {
    const handlerList = this._handlerIdList()
    const urlListPerHandler = await Promise.all(handlerList.map((handlerId) => this._handledUrlListFor({handlerId})))

    return handlerList.reduce((acc, handlerId, index) => ({[handlerId]: urlListPerHandler[index], ...acc}), {})
  }

  async handledUrls() {
    const urlListPerHandler = await Promise.all(this._handlerIdList()
      .map((handlerId) => this._handledUrlListFor({handlerId})))

    return urlListPerHandler.reduce((acc, urlList) => [...acc, ...urlList], [])
  }

  async handle({url}) {
    const handledUrlsPerHandler = await this.handledUrlsPerHandler()
    const handlersIdsForUrl = Object.keys(handledUrlsPerHandler)
      .filter((handlerId) => handledUrlsPerHandler[handlerId].indexOf(url) > -1)

    if (handlersIdsForUrl.length !== 1) {
      throw new Error(`"${url}" is handled by ${handlersIdsForUrl.length} handlers: 
        ${handlersIdsForUrl.join(',')}`)
    }

    return this._handleUrlVia({handlerId: handlersIdsForUrl[0], url})
  }

  /* Private operations */
  _handlerIdList() {
    this._ensureHandlers()
    return Object.keys(this._cache.handlers)
  }

  async _handledUrlListFor({handlerId}) {
    this._ensureHandler({handlerId})

    const handler = this._cache.handlers[handlerId]

    if (!handler) {
      throw new Error(`Handler with id ${handlerId} not found!`)
    }

    if (handler.handles !== null) {
      return handler.handles
    }
    const newUrlList = await handler.instance.handles({project: this._project})
    handler.handles = newUrlList
    return newUrlList
  }

  async _handleUrlVia({url, handlerId}) {
    this._ensureHandler({handlerId})
    const handlerInstance = this._cache.handlers[handlerId].instance
    return handlerInstance.handle({project: this._project, url})
  }

  async persistCache() {
    const cacheHandlersWithoutFns =
      Object.keys(this._cache.handlers)
        .map((id) => {
          const cacheItemCopy = {...this._cache.handlers[id]}
          delete cacheItemCopy.instance
          return {cacheItemCopy, id}
        })
        .reduce((acc, {id, cacheItemCopy}) => ({[id]: cacheItemCopy, ...acc}), {})
    const cache = {handlers: cacheHandlersWithoutFns}
    return writeObject({
      cachePath: this._project.cachePath(),
      key: 'routes',
      object: cache
    })
  }

  async loadCache() {
    const cache = await readObject({
      cachePath: this._project.cachePath(),
      key: 'routes'
    })

    if (cache === null) {
      // Means we have no cache at all.
      return
    }

    this._cache = cache
  }

  /* Cache operations */
  _ensureHandler({handlerId}) {
    if (!this._cache.handlers[handlerId]) {
      this._cache.handlers[handlerId] = {
        handles: null,
        instance: null
      }
    }
    const handlerCache = this._cache.handlers[handlerId]

    if (!handlerCache.instance) {
      const handlers = this._project._project.routeHandlers() // eslint-disable-line no-underscore-dangle
      handlerCache.instance = handlers[handlerId]
    }
  }

  _ensureHandlers() {
    const handlers = this._project._project.routeHandlers() // eslint-disable-line no-underscore-dangle

    Object.keys(handlers).forEach((handlerId) => {
      this._ensureHandler({handlerId})
    })
  }
}
