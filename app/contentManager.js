const debugc = require('debug')
const Rx = require('rxjs')
const {clearCache, readHash, markCacheItemAsDirty, writeHash, readCache, writeCache} = require('./utils/cache')

const debug = debugc('fil:contentManager')

class ContentManager {
  constructor({cachePath, contentTypes, contentVersion, listenToChanges}) {
    this._contentTypes = contentTypes
    this._contentVersion = contentVersion
    this._listenToChanges = listenToChanges
    this._cachePath = cachePath
    this._watcherCancelFunctions = []
    this._cache = {}
    this._allContentsChangeSubscriber = null
    this._allContentsChangeObservable = Rx.Observable.create((subscriber) => {
      this._allContentsChangeSubscriber = subscriber
    })
  }

  async init() {
    let useCache = false
    if (this._cachePath !== null) {
      debug('Checking if project is changed while fil is not running')
      const [currentHash, cachedHash] = await Promise.all([
        this._contentVersion(),
        readHash({cachePath: this._cachePath}).catch(() => null)
      ])
      useCache = currentHash === cachedHash
      debug(`Current: ${currentHash} Cached: ${cachedHash}`)

      if (!useCache) {
        debug('Cache will be ignored.')
        await clearCache({cachePath: this._cachePath})
        debug('Deleted the obsolete cache data...')
      }
    }

    debug('Loading contents from project...')
    await Promise.all(
      Object.keys(this._contentTypes).map(
        async (ct) => {
          if (useCache) {
            debug(`Reading contents from cache for ${ct}...`)
            this._cache[ct] =
              await readCache({
                cachePath: this._cachePath,
                key: ct
              })
            debug(`Read contents from cache for ${ct}.`)
          } else {
            debug(`Discovering contents from project for ${ct}...`)
            const itemIds = await this._contentTypes[ct].discover()
            debug(`Discovered contents from disk for ${ct}.`)

            debug(`Reading contents from project for ${ct}...`)
            const contents = await Promise.all(
              itemIds.map(async (id) => ({
                content: await this._contentTypes[ct].read({id}),
                id
              }))
            )
            this._cache[ct] = contents.reduce((acc, content) => ({...acc, [content.id]: content.content}), {})
            debug(`Read contents from project for ${ct}.`)
          }
        }
      )
    )
    debug('Loaded contents.')

    if (this._listenToChanges) {
      this._initWatchers()
    } else {
      debug('I am configured not to watch changes!')
    }
  }

  watcher$() {
    return this._allContentsChangeObservable
  }

  async persistCache() {
    if (this._cachePath !== null) {
      return
    }

    const hash = await this._contentVersion()
    debug(`Content hash: ${hash}`)

    await Promise.all([
      writeHash({cachePath: this._cachePath, hash}),
      ...Object.keys(this._contentTypes).map(
        (ct) => writeCache({
          cachePath: this._cachePath,
          items: this._cache[ct],
          key: ct
        })
      )
    ])
  }

  async destruct() {
    this._watcherCancelFunctions.forEach((fn) => fn())
  }

  _initWatchers() {
    this._watcherCancelFunctions = Object.keys(this._contentTypes).map(
      (ct) => {
        debug(`Setting up the watchers for ${ct}...`)
        const cancelFn = this._contentTypes[ct].watchChanges({notifyFn: this._onContentChanged.bind(this, ct)})
        debug(`Done up the watchers for ${ct}...`)
        return cancelFn
      }
    )
      .filter((fn) => fn instanceof Function)
  }

  /* Private operations */
  async _onContentChanged(contentType, id) {
    debug(`Content changed for: ${contentType}/${id ? id : '@collection'}`)

    if (id) {
      const content = await this._contentTypes[contentType].read({id})
      this._cache[contentType][id] = markCacheItemAsDirty(content)
    } else {
      const newIds = await this._contentTypes[contentType].discover()
      const oldIds = Object.keys(this._cache[contentType])
      const removed = oldIds.filter(
        (oid) => newIds.filter((nid) => oid === nid).length === 0
      )
      const added = newIds.filter(
        (nid) => oldIds.filter((oid) => oid === nid).length === 0
      )

      removed.forEach((r) => {
        delete this._cache[contentType][r]
      })

      await Promise.all(added.map(async (a) => {
        const content = await this._contentTypes[contentType].read({id: a})
        this._cache[contentType][a] = markCacheItemAsDirty(content)
      }))
    }

    // Notify global subscriber that something changed recently
    this._allContentsChangeSubscriber.next()
  }
}

module.exports = {ContentManager}
