import {readObject, writeObject} from './utils/cache'
import Rx from 'rxjs/Rx'
import debugc from 'debug'

const debug = debugc('fil:contentManager')

export class ContentManager {
  constructor({project}) {
    this._project = project
    this._cache = {contents: {}}
    this._allContentsChangeSubscriber = null
    this._allContentsChangeObservable = Rx.Observable.create((subscriber) => {
      this._allContentsChangeSubscriber = subscriber
    })
  }

  contentTypes() {
    return Object.keys(this._project._project.contentTypes()) // eslint-disable-line no-underscore-dangle
  }

  async metaOf({id}) {
    const handler = this._getHandlerFor({id})
    const cacheEnabledCalculatorFn = handler.useChildrenCache || ContentManager.defaultCacheCalculator
    const useCache = await cacheEnabledCalculatorFn({id})

    if (!useCache) {
      const children = await handler.children({
        id,
        project: this._project
      })

      return {
        children,
        id,
        type: id.split('@')[0]
      }
    }

    await this._ensureCachedChildrenFor({id})

    const cachedContent = this._cache.contents[id]
    return {
      children: cachedContent.children,
      id,
      type: id.split('@')[0]
    }
  }

  async valueOf({id}) {
    const handler = this._getHandlerFor({id})
    const cacheEnabledCalculatorFn = handler.useContentCache || ContentManager.defaultCacheCalculator
    const useCache = await cacheEnabledCalculatorFn({id})

    if (!useCache) {
      return handler.content({
        id,
        project: this._project
      })
    }

    await this._ensureCachedContentFor({id})

    return this._cache.contents[id].content
  }

  watcher$() {
    return this._allContentsChangeObservable
  }

  async persistCache() {
    const cacheContentsWithoutFns =
      Object.keys(this._cache.contents)
        .map((id) => {
          const cacheItemCopy = {...this._cache.contents[id]}
          delete cacheItemCopy.fn
          delete cacheItemCopy.contentSubscription
          delete cacheItemCopy.childrenSubscription
          return {cacheItemCopy, id}
        })
        .reduce((acc, {id, cacheItemCopy}) => ({[id]: cacheItemCopy, ...acc}), {})
    const cache = {contents: cacheContentsWithoutFns}
    return writeObject({
      cachePath: this._project.cachePath(),
      key: 'contents',
      object: cache
    })
  }

  disposeChangeListeners() {
    Object.keys(this._cache.contents)
      .forEach((id) => {
        const cacheItem = this._cache.contents[id]
        if (cacheItem.contentSubscription) {
          cacheItem.contentSubscription.unsubscribe()
        }
        if (cacheItem.childrenSubscription) {
          cacheItem.childrenSubscription.unsubscribe()
        }
      })
  }

  async loadCache() {
    const cache = await readObject({
      cachePath: this._project.cachePath(),
      key: 'contents'
    })

    if (cache === null) {
      // Means we have no cache at all.
      return
    }

    this._cache = cache
  }

  initChangeListeners() {
    Object.keys(this._cache.contents)
      .forEach((id) => {
        this._startWatchingContentChangesOf({id})
        this._startWatchingChildChangesOf({id})
      })
  }

  /* Private operations */
  _ensureCacheEntryFor({id}) {
    if (!this._cache.contents[id]) {
      this._cache.contents[id] = {
        children: null,
        childrenSubscription: null,

        content: null,
        contentSubscription: null,

        fn: null
      }
    }
    const cachedContent = this._cache.contents[id]

    if (!cachedContent.fn) {
      cachedContent.fn = this._getHandlerFor({id})
    }
  }

  _getHandlerFor({id}) {
    const handlers = this._project._project.contentTypes() // eslint-disable-line no-underscore-dangle
    const handlerKey = id.split('@')[0]
    const handler = handlers[handlerKey]
    if (!handler) {
      throw new Error(`Handler "${handlerKey}" can't be found for content "${id}"`)
    }
    return handler
  }

  async _ensureCachedContentFor({id}) {
    this._ensureCacheEntryFor({id})

    const cachedContent = this._cache.contents[id]

    if (cachedContent.content !== null) { return }
    debug(`Content Cache miss for: ${id}`)

    cachedContent.content = await cachedContent.fn.content({
      id,
      project: this._project
    })

    this._startWatchingContentChangesOf({id})
  }

  async _onContentChangeFnFor({id}) {
    debug(`Content changed for: ${id}`)
    this._ensureCacheEntryFor({id})

    const cachedContent = this._cache.contents[id]

    cachedContent.content = null
    if (cachedContent.contentSubscription) {
      cachedContent.contentSubscription.unsubscribe()
      cachedContent.contentSubscription = null
    }

    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next()
  }

  async _onChildrenChangeFnFor({id}) {
    debug(`Children changed for: ${id}`)
    this._ensureCacheEntryFor({id})

    const oldChildren = this._cache.contents[id].children
    this._cache.contents[id].children = null
    await this._ensureCachedChildrenFor({id})
    const newChildren = this._cache.contents[id].children
    const removedChildren = oldChildren.filter((oc) => newChildren.indexOf(oc) === -1)

    await Promise.all(removedChildren.map((c) => this._deleteCacheEntryFor({id: c})))

    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next()
  }

  async _deleteCacheEntryFor({id}) {
    const cachedContent = this._cache.contents[id]

    if (!cachedContent) { return }
    if (cachedContent.childrenSubscription) {
      cachedContent.childrenSubscription.unsubscribe()
    }
    if (cachedContent.contentSubscription) {
      cachedContent.contentSubscription.unsubscribe()
    }
    if (cachedContent.children) {
      await Promise.all(cachedContent.children.map((c) => this._deleteCacheEntryFor(c)))
    }

    delete this._cache.contents[id]
  }

  async _ensureCachedChildrenFor({id}) {
    this._ensureCacheEntryFor({id})

    const cachedContent = this._cache.contents[id]

    if (cachedContent.children !== null) { return }
    debug(`Child Cache miss for: ${id}`)

    const childrenCalculatorFn = cachedContent.fn.children || ContentManager.defaultChildrenCalculator
    cachedContent.children = await childrenCalculatorFn({
      id,
      project: this._project
    })

    this._startWatchingChildChangesOf({id})
  }

  _startWatchingContentChangesOf({id}) {
    this._ensureCacheEntryFor({id})
    const content = this._cache.contents[id]

    if (this._project._listenToChanges && // eslint-disable-line no-underscore-dangle
        !content.contentSubscription && content.fn.contentWatcher$ &&
        content.content !== null) {
      content.contentSubscription = content.fn.contentWatcher$({id})
        .subscribe(this._onContentChangeFnFor.bind(this, {id}))
    }
  }

  _startWatchingChildChangesOf({id}) {
    this._ensureCacheEntryFor({id})
    const content = this._cache.contents[id]

    if (this._project._listenToChanges && // eslint-disable-line no-underscore-dangle
        !content.childrenSubscription && content.fn.childrenWatcher$ &&
        content.children !== null) {
      debug(`Listening for child changes of ${id}`)
      content.childrenSubscription = content.fn.childrenWatcher$({id})
        .subscribe(this._onChildrenChangeFnFor.bind(this, {id}))
    }
  }
}
ContentManager.defaultCacheCalculator = async () => true
ContentManager.defaultChildrenCalculator = async () => ({})
