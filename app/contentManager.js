import {ReactiveCache} from './reactiveCache'
import Rx from 'rxjs/Rx'
import debugc from 'debug'

const debug = debugc('fil:contentManager')

export class ContentManager {
  constructor({project, checkForChanges}) {
    this._project = project
    this._checkForChanges = checkForChanges
    this._cache = new ReactiveCache()
    this._allContentsChangeSubscriber = null
    this._allContentsChangeObservable = Rx.Observable.create((subscriber) => {
      this._allContentsChangeSubscriber = subscriber
    })
  }

  contentTypes() {
    return Object.keys(this._project._project.contentTypes) // eslint-disable-line no-underscore-dangle
  }

  async metaOf({id, type}) {
    const handler = this._getHandlerFor({type})
    const cacheEnabledCalculatorFn = handler.useChildrenCache || (() => Boolean(handler.childrenWatcher))
    const useCache = cacheEnabledCalculatorFn({id, type})

    const valueFn = async () => {
      const childrenCalculatorFn = handler.children || ContentManager.defaultChildrenCalculator

      const children = await childrenCalculatorFn({
        id,
        project: this._project,
        type
      })

      return {
        children,
        id,
        type
      }
    }

    if (!useCache) { return valueFn() }

    const cacheKey = `${type}/meta/${id}`

    return this._cache.calculate({
      id: cacheKey,
      notifyFn: this._onChildrenChanged.bind(this, {id, type}),
      valueFn,
      watchFn: this._getWatcherFunction({candidateFn: handler.childrenWatcher, id, type})
    })
  }

  async valueOf({id, type}) {
    const handler = this._getHandlerFor({type})
    const cacheEnabledCalculatorFn = handler.useContentCache || (() => Boolean(handler.contentWatcher))
    const useCache = cacheEnabledCalculatorFn({id, type})

    const valueFn = async () =>
      handler.content({
        id,
        project: this._project,
        type
      })

    if (!useCache) { return valueFn() }

    const cacheKey = `${type}/content/${id}`

    return this._cache.calculate({
      id: cacheKey,
      notifyFn: this._onContentChanged.bind(this, {id, type}),
      valueFn,
      watchFn: this._getWatcherFunction({candidateFn: handler.contentWatcher, id, type})
    })
  }

  watcher$() {
    return this._allContentsChangeObservable
  }

  async persistCache() {
    return this._cache.persistCache({
      cachePath: this._project.cachePath,
      key: 'contents'
    })
  }

  async loadCache() {
    await this._cache.loadCache({
      cachePath: this._project.cachePath,
      functionLoaderFn: ({id: cacheKey}) => {
        const [type, cacheType, ...idPieces] = cacheKey.split('/')
        const id = idPieces.join('/')
        debug(`functionLoaderFn invoked for ${cacheKey}`)
        const handler = this._getHandlerFor({type})
        if (cacheType === 'meta') {
          return {
            notifyFn: this._onChildrenChanged.bind(this, {id, type}),
            watchFn: this._getWatcherFunction({candidateFn: handler.childrenWatcher, id, type})
          }
        }

        if (cacheType === 'content') {
          return {
            notifyFn: this._onContentChanged.bind(this, {id, type}),
            watchFn: this._getWatcherFunction({candidateFn: handler.contentWatcher, id, type})
          }
        }

        throw new Error(`I have no idea about how to load "${id}" from cache.`)
      },
      key: 'contents'
    })
  }

  /* Private operations */
  _getHandlerFor({type}) {
    const handlers = this._project._project.contentTypes // eslint-disable-line no-underscore-dangle
    const handler = handlers[type]
    if (!handler) {
      throw new Error(`Handler "${type}" can't be found.`)
    }
    return handler
  }

  _onContentChanged({id, type}) {
    debug(`Content changed for: ${type}/${id}`)
    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next()
  }

  async _onChildrenChanged({id, type}, {oldValue}) {
    debug(`Children changed for: ${type}/${id}`)

    const oldChildren = oldValue.children
    const newChildren = (await this.metaOf({id, type})).children
    const removedChildren = oldChildren.filter(
      ({id: ocId, type: ocType}) =>
        newChildren.filter(({id: ncId, type: ncType}) => ocId === ncId && ocType === ncType).length === 0
    )

    removedChildren.map(({id: rId, type: rType}) => this._deleteContent({id: rId, type: rType}))

    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next()
  }

  _deleteContent({id, type}) {
    this._cache.remove({id: `${type}/content/${id}`})
    const meta = this._cache.remove({id: `${type}/meta/${id}`})

    if (meta && meta.children) {
      meta.children.map(({id: rId, type: rType}) => this._deleteContent({id: rId, type: rType}))
    }
  }

  _getWatcherFunction({candidateFn, id, type}) {
    return ({notifyFn}) => {
      let fn = candidateFn || ContentManager.defaultWatcher
      if (!this._checkForChanges) {
        fn = ContentManager.defaultWatcher
      }
      return fn({id, notifyFn, type})
    }
  }
}
ContentManager.defaultWatcher = () => null
ContentManager.defaultChildrenCalculator = () => []
