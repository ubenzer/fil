import {binaryCacheTypes, binaryItemsFromDisk, binaryItemsToDisk} from "./utils/binaryCacheHelpers"
import {fsPromise, translateError} from "./utils/misc"
import {Project} from "./project"
import debugc from "debug"
import path from "path"

const debug = debugc("fil:routeManager")

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
        ${handlersIdsForUrl.join(",")}`)
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

    const accountingKey = RouteManager.binaryFieldDesriptorKey
    const cachePath = this._project.cachePath()

    const handler = this._cache.handlers[handlerId]

    if (!handler) {
      throw new Error(`Handler with id ${handlerId} not found!`)
    }

    const handlesArgumentsFn = handler.instance.handlesArguments || RouteManager.defaultHandlesArguments

    // Check arguments first to see if we already have a calculated value
    const [oldArgs, newArgs] = await Promise.all([
      binaryItemsFromDisk({
        accountingKey,
        cachePath,
        id: handlerId,
        json: handler.handlesArgs,
        type: binaryCacheTypes.handlesArgs
      }),
      handlesArgumentsFn({project: this._project})
    ])
    const areArgsSame = Project.compareArgumentCache({newArgs, oldArgs})

    if (!areArgsSame) { debug(`Route Cache miss for: ${handlerId}`) }

    if (handler.handles !== null && areArgsSame) {
      return handler.handles
    }
    const newUrlList = await handler.instance.handles(newArgs)

    handler.handlesArgs = await binaryItemsToDisk({
      accountingKey,
      cachePath,
      id: handlerId,
      json: newArgs,
      type: binaryCacheTypes.handlesArgs
    })
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
          cacheItemCopy.instance = null
          return {cacheItemCopy, id}
        })
        .reduce((acc, {id, cacheItemCopy}) => ({[id]: cacheItemCopy, ...acc}), {})
    const cache = {handlers: cacheHandlersWithoutFns}
    const filePath = path.join(this._project.cachePath(), "routes.json")
    // noinspection JSUnresolvedFunction
    return fsPromise.outputJsonAsync(filePath, cache)
  }

  async loadCache() {
    const filePath = path.join(this._project.cachePath(), "routes.json")
    // noinspection JSUnresolvedFunction
    const json = await fsPromise.readJsonAsync(filePath).catch(translateError)

    if (json instanceof Error) {
      // Means we have no cache at all.
      return
    }

    this._cache = json
  }

  /* Cache operations */
  _ensureHandler({handlerId}) {
    if (!this._cache.handlers[handlerId]) {
      this._cache.handlers[handlerId] = {
        handles: null,
        handlesArgs: null,
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
RouteManager.binaryFieldDesriptorKey = "_binaryFields"
RouteManager.defaultHandlesArguments = async ({id}) => ({id})
