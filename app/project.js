import {clearCache, readHash, writeHash} from './utils/cache'
import {ContentManager} from './contentManager'
import {RouteManager} from './routeManager'
import Rx from 'rxjs/Rx'
import debugc from 'debug'
import os from 'os'
import path from 'path'
import {toObservable} from './utils/misc'
import uuidV1 from 'uuid/v1'

const debug = debugc('fil:project')

export class Project {
  constructor({listenToChanges, project, useCache}) {
    const contentTypes = Object.keys(project.routeHandlers)
      .map((key) => {
        const handler = project.routeHandlers[key]
        const content = Project.routeHandler2RegularContent({routeHandler: handler, type: key})
        return {content, key}
      })
      .reduce((acc, {content, key}) => {
        if (acc[key]) {
          throw new Error(`Duplicate key ${key}`)
        }
        return {[key]: content, ...acc}
      }, project.contentTypes || {})

    this._project = {...project, contentTypes}

    this._listenToChanges = listenToChanges
    this._useCache = useCache
    this._routeManager = new RouteManager({project: this})
    this._contentManager = new ContentManager({checkForChanges: listenToChanges, project: this})

    if (this._useCache) {
      this.cachePath = this._project.cachePath
    } else {
      this.cachePath = path.join(os.tmpdir(), uuidV1())
    }
  }

  /* init & dispose logic */
  async initCache() {
    if (!this._useCache) {
      debug('Cache will not be used')
      return
    }
    debug('Checking if project is changed while fil is not running')
    const cachePath = this._project.cachePath
    const [currentHash, cachedHash] = await Promise.all([
      this._project.contentVersion(),
      readHash({cachePath}).catch(() => null)
    ])
    debug(`Current: ${currentHash} Cached: ${cachedHash}`)

    if (currentHash !== cachedHash) {
      debug('Cache will be ignored.')
      await clearCache({cachePath})
      debug(`Deleted up obsolete cache data... (${cachePath})`)
      return
    }

    debug('Loading cache...')
    await this._contentManager.loadCache()
    debug('Cache ready!')
  }

  /* Route related stuff */
  async handledUrlsPerHandler() {
    return this._routeManager.handledUrlsPerHandler()
  }
  async handledUrls() {
    return this._routeManager.handledUrls()
  }
  async handle({url}) {
    return this._routeManager.handle({url})
  }

  /* Content related stuff */
  contentTypes() {
    // Returns an array of registered types
    return this._contentManager.contentTypes()
  }
  async metaOf({id, type}) {
    // / Returns all contents registered to a type
    return this._contentManager.metaOf({id, type})
  }
  async valueOf({id, type}) {
    return this._contentManager.valueOf({id, type})
  }

  /* Cache persistence */
  async persistCache() {
    if (!this._useCache) { return }
    debug('Persisting cache')

    const cachePath = this._project.cachePath
    const hash = await this._project.contentVersion()
    debug(`Content hash: ${hash}`)

    return Promise.all([
      writeHash({cachePath, hash}),
      this._contentManager.persistCache()
    ])
  }

  /* The ultimate change detector */
  watcher$() {
    if (!this._listenToChanges) { return Rx.Observable.empty() }
    return Rx.Observable.merge(
      this._contentManager.watcher$(),
      toObservable({fn: this._project.watcher})
    )
  }

  /* Path resolving */
  outPath() {
    return this._project.outPath
  }
}
Project.routeHandler2RegularContent = ({type, routeHandler}) => {
  const handleFn = routeHandler.handle
  const handlesFn = routeHandler.handles
  const useHandleCache = routeHandler.useHandleCache
  const useHandlesCache = routeHandler.useHandlesCache
  const handleWatcherFn = routeHandler.handleWatcher
  const handlesWatcherFn = routeHandler.handlesWatcher

  return {
    children: async ({project}) => {
      const urls = await handlesFn({project})
      return urls.map((url) => ({
        id: url,
        type
      }))
    },
    childrenWatcher: handlesWatcherFn,
    content: ({id, project}) => handleFn({project, url: id}),
    contentWatcher: handleWatcherFn ? ({id, notifyFn}) => handleWatcherFn({notifyFn, url: id}) : null,
    useChildrenCache: useHandlesCache,
    useContentCache: useHandleCache
  }
}
