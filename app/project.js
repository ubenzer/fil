const {ContentManager} = require('./contentManager')
const {RouteManager} = require('./routeManager')
const Rx = require('rxjs/Rx')
const debugc = require('debug')
const os = require('os')
const path = require('path')
const {toObservable} = require('./utils/misc')
const uuidV1 = require('uuid/v1')

const debug = debugc('fil:project')

class Project {
  constructor({listenToChanges, project, useCache}) {
    this._project = project
    this._listenToChanges = listenToChanges
    this._useCache = useCache
    if (useCache) {
      this._cachePath = this._project.cachePath
    } else {
      debug('Cache will not be used')
      this._cachePath = path.join(os.tmpdir(), uuidV1())
    }
  }

  async init() {
    debug('Initializing content manager...')
    this._contentManager = new ContentManager({
      cachePath: this._cachePath,
      contentTypes: this._project.contentTypes,
      contentVersion: this._project.contentVersion,
      listenToChanges: this._listenToChanges
    })
    await this._contentManager.init()
    debug('Content manager ready.')

    debug('Initializing route manager...')
    this._routeManager = new RouteManager({project: this})
    debug('Content manager is ready.')
  }

  /* Route related stuff */
  async handledUrls() {
    return this._routeManager.handledUrls()
  }

  async handle({url}) {
    return this._routeManager.handle({url})
  }

  async handleAll({urlProcessFn}) {
    return this._routeManager.handleAll({urlProcessFn})
  }

  /* Content related stuff */
  contentTypes() {
    // Returns an array of registered types
    return this._contentManager.contentTypes()
  }

  querier() {
    // eslint-disable-next-line no-underscore-dangle
    return this._contentManager._cache
  }

  /* Cache persistence */
  async persistCache() {
    if (!this._useCache) { return }
    debug('Persisting cache')

    await this._contentManager.persistCache()
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

module.exports = {Project}
