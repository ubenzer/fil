import {binaryCacheTypes, binaryItemsFromDisk,
  binaryItemsToDisk, clearBinaryItemsFromDisk} from "./utils/binaryCacheHelpers"
import {fsPromise, translateError} from "./utils/misc"
import {Project} from "./project"
import Rx from "rxjs/Rx"
import debugc from "debug"
import path from "path"

const debug = debugc("fil:contentManager")

export class ContentManager {
  constructor({project}) {
    this._project = project
    this._cache = {contents: {}}
    this._allContentsChangeSubscriber = null
    // noinspection JSUnresolvedFunction
    this._allContentsChangeObservable = Rx.Observable.create((subscriber) => {
      this._allContentsChangeSubscriber = subscriber
    })
    this._baseBinaryConfig = {
      accountingKey: ContentManager.binaryFieldDesriptorKey,
      cachePath: this._project.cachePath()
    }
  }

  contentTypes() {
    return Object.keys(this._project._project.contentTypes()) // eslint-disable-line no-underscore-dangle
  }

  async metaOf({id}) {
    await this._ensureCachedChildrenFor({id})

    const cachedContent = this._cache.contents[id]
    return {
      children: cachedContent.children,
      id,
      type: id.split("@")[0]
    }
  }

  async valueOf({id}) {
    await this._ensureCachedContentFor({id})

    const cachedContent = this._cache.contents[id].content

    return binaryItemsFromDisk({
      id,
      json: cachedContent,
      type: binaryCacheTypes.content,
      ...this._baseBinaryConfig
    })
  }

  watcher$() {
    return this._allContentsChangeObservable
  }

  async persistCache() {
    const cacheContentsWithoutFns =
      Object.keys(this._cache.contents)
        .map((id) => {
          const cacheItemCopy = {...this._cache.contents[id]}
          cacheItemCopy.fn = null
          cacheItemCopy.contentSubscription = null
          cacheItemCopy.childrenSubscription = null
          return {cacheItemCopy, id}
        })
        .reduce((acc, {id, cacheItemCopy}) => ({[id]: cacheItemCopy, ...acc}), {})
    const cache = {contents: cacheContentsWithoutFns}
    const filePath = path.join(this._project.cachePath(), "contents.json")
    // noinspection JSUnresolvedFunction
    return fsPromise.outputJsonAsync(filePath, cache)
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
    const filePath = path.join(this._project.cachePath(), "contents.json")
    // noinspection JSUnresolvedFunction
    const json = await fsPromise.readJsonAsync(filePath).catch(translateError)

    if (json instanceof Error) {
      // Means we have no cache at all.
      return
    }

    this._cache = json
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
        childrenArgs: null,
        childrenSubscription: null,

        content: null,
        contentArgs: null,
        contentSubscription: null,

        fn: null
      }
    }
    const cachedContent = this._cache.contents[id]

    if (!cachedContent.fn) {
      const handlers = this._project._project.contentTypes() // eslint-disable-line no-underscore-dangle
      cachedContent.fn = handlers[id.split("@")[0]]
    }
  }

  async _ensureCachedContentFor({id}) {
    this._ensureCacheEntryFor({id})

    const cachedContent = this._cache.contents[id]

    // Check arguments first to see if we already have a calculated value
    const contentArgumentsFn = cachedContent.fn.contentArguments || ContentManager.defaultContentArguments

    const [oldArgs, newArgs] = await Promise.all([
      binaryItemsFromDisk({
        id,
        json: cachedContent.contentArgs,
        type: binaryCacheTypes.contentArgs,
        ...this._baseBinaryConfig
      }),
      contentArgumentsFn({
        id,
        project: this._project
      })
    ])
    const areArgsSame = Project.compareArgumentCache({newArgs, oldArgs})

    if (cachedContent.content !== null && areArgsSame) { return }
    debug(`Content Cache miss for: ${id}`)

    const newContent = await cachedContent.fn.content(newArgs)

    await Promise.all([
      clearBinaryItemsFromDisk({
        id,
        json: cachedContent.contentArgs,
        type: binaryCacheTypes.contentArgs,
        ...this._baseBinaryConfig
      }),
      clearBinaryItemsFromDisk({
        id,
        json: cachedContent.content,
        type: binaryCacheTypes.content,
        ...this._baseBinaryConfig
      })
    ])

    const [contentArgs, content] = await Promise.all([
      binaryItemsToDisk({
        id,
        json: newArgs,
        type: binaryCacheTypes.contentArgs,
        ...this._baseBinaryConfig
      }),
      binaryItemsToDisk({
        id,
        json: newContent,
        type: binaryCacheTypes.content,
        ...this._baseBinaryConfig
      })
    ])
    cachedContent.contentArgs = contentArgs
    cachedContent.content = content

    this._startWatchingContentChangesOf({id})
  }

  async _onContentChangeFnFor({id}) {
    debug(`Content changed for: ${id}`)
    this._ensureCacheEntryFor({id})

    const cachedContent = this._cache.contents[id]
    const cachePath = this._project.cachePath()
    const accountingKey = ContentManager.binaryFieldDesriptorKey

    await Promise.all([
      clearBinaryItemsFromDisk({
        accountingKey,
        cachePath,
        id,
        json: cachedContent.content,
        type: binaryCacheTypes.content
      }),
      clearBinaryItemsFromDisk({
        accountingKey,
        cachePath,
        id,
        json: cachedContent.contentArgs,
        type: binaryCacheTypes.contentArgs
      })
    ])

    cachedContent.contentArgs = null
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

    await Promise.all([
      clearBinaryItemsFromDisk({
        id,
        json: cachedContent.content,
        type: binaryCacheTypes.content,
        ...this._baseBinaryConfig
      }),
      clearBinaryItemsFromDisk({
        id,
        json: cachedContent.contentArgs,
        type: binaryCacheTypes.contentArgs,
        ...this._baseBinaryConfig
      }),
      clearBinaryItemsFromDisk({
        id,
        json: cachedContent.childrenArgs,
        type: binaryCacheTypes.childrenArgs,
        ...this._baseBinaryConfig
      })
    ])

    delete this._cache.contents[id]
  }

  async _ensureCachedChildrenFor({id}) {
    this._ensureCacheEntryFor({id})

    const cachedContent = this._cache.contents[id]

    // Check arguments first to see if we already have a calculated value
    const childrenArguments = cachedContent.fn.childrenArguments || ContentManager.defaultChildrenArguments

    const [oldArgs, newArgs] = await Promise.all([
      binaryItemsFromDisk({
        id,
        json: cachedContent.childrenArgs,
        type: binaryCacheTypes.childrenArgs,
        ...this._baseBinaryConfig
      }),
      childrenArguments({
        id,
        project: this._project
      })
    ])
    const areArgsSame = Project.compareArgumentCache({
      newArgs,
      oldArgs
    })

    if (cachedContent.children !== null && areArgsSame) { return }
    debug(`Child Cache miss for: ${id}`)

    const childrenCalculatorFn = cachedContent.fn.children || ContentManager.defaultChildrenCalculator
    const newChildren = await childrenCalculatorFn(newArgs)

    await clearBinaryItemsFromDisk({
      id,
      json: cachedContent.childrenArgs,
      type: binaryCacheTypes.childrenArgs,
      ...this._baseBinaryConfig
    })

    cachedContent.childrenArgs = await binaryItemsToDisk({
      id,
      json: newArgs,
      type: binaryCacheTypes.childrenArgs,
      ...this._baseBinaryConfig
    })
    cachedContent.children = newChildren

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
      content.childrenSubscription = content.fn.childrenWatcher$({id})
        .subscribe(this._onChildrenChangeFnFor.bind(this, {id}))
    }
  }
}
ContentManager.defaultChildrenCalculator = async () => ({})
ContentManager.defaultChildrenArguments = async ({id}) => ({id})
ContentManager.defaultContentArguments = async ({id}) => ({id})
ContentManager.binaryFieldDesriptorKey = "_binaryFields"
