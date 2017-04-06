import {clearCache, readHash, writeHash} from './utils/cache'
import {ContentManager} from './contentManager'
import {RouteManager} from './routeManager'
import Rx from 'rxjs/Rx'
import debugc from 'debug'
import deepEql from 'deep-eql'
import os from 'os'
import path from 'path'
import uuidV1 from 'uuid/v1'

const debug = debugc('fil:project')

export class Project {
  constructor({listenToChanges, project, useCache}) {
    this._project = project
    this._listenToChanges = listenToChanges
    this._useCache = useCache
    this._routeManager = new RouteManager({project: this})
    this._contentManager = new ContentManager({project: this})
  }

  /* init & dispose logic */
  async initCache() {
    if (!this._useCache) {
      debug('Cache will not be used')
      return
    }
    debug('Checking if project is changed while fil is not running')
    const cachePath = this._project.cachePath()
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

    return Promise.all([
      this._contentManager.loadCache(),
      this._routeManager.loadCache()
    ])
  }
  initChangeListeners() {
    if (!this._listenToChanges) { return }
    this._contentManager.initChangeListeners()
  }
  disposeChangeListeners() {
    if (!this._listenToChanges) { return }
    this._contentManager.disposeChangeListeners()
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
  async contentTypes() {
    // Returns an array of registered types
    return this._contentManager.contentTypes()
  }
  async metaOf({id}) {
    // / Returns all contents registered to a type
    return this._contentManager.metaOf({id})
  }
  async valueOf({id}) {
    return this._contentManager.valueOf({id})
  }

  /* Cache persistence */
  async persistCache() {
    if (!this._useCache) { return }
    debug('Persisting cache')

    const cachePath = this._project.cachePath()
    const hash = await this._project.contentVersion()
    debug(`Content hash: ${hash}`)

    return Promise.all([
      writeHash({cachePath, hash}),
      this._contentManager.persistCache(),
      this._routeManager.persistCache()
    ])
  }

  /* The ultimate change detector */
  watcher$() {
    if (!this._listenToChanges) { return Rx.Observable.empty() }
    return Rx.Observable.merge(
      this._contentManager.watcher$(),
      this._project.watcher$()
    )
  }

  /* Path resolving */
  outPath() {
    return this._project.outPath()
  }
  cachePath() {
    if (this._useCache) { return this._project.cachePath() }
    return path.join(os.tmpdir(), uuidV1())
  }
}
Project.compareArgumentCache = ({newArgs, oldArgs}) => deepEql(newArgs, oldArgs)
