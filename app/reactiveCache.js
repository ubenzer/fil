import {readObject, writeObject} from './utils/cache'
import debugc from 'debug'
const debug = debugc('fil:reactiveCache')

export class ReactiveCache {
  constructor() {
    this._cache = {}
  }

  async calculate({id, valueFn, watchFn, notifyFn}) {
    if (this._cache[id]) {
      return this._cache[id].value
    }

    debug(`Child Cache miss for: ${id}`)
    const value = await valueFn()
    this._setAndWatchCache({id, notifyFn, value, watchFn})
    return value
  }

  remove({id}) {
    const cachedItem = this._cache[id]
    if (!cachedItem) { return null }

    const {unsubscribeFn, value} = cachedItem
    unsubscribeFn({oldValue: value})
    delete this._cache[id]
    return value
  }

  async persistCache({cachePath, key}) {
    const values = Object.keys(this._cache)
      .map((id) => {
        const value = this._cache[id].value
        return {id, value}
      })

    return writeObject({
      cachePath,
      key,
      object: values
    })
  }

  async loadCache({cachePath, key, functionLoaderFn}) {
    const values = await readObject({
      cachePath,
      key
    })

    if (values === null) {
      // Means we have no cache at all.
      return
    }

    values.forEach(({id, value}) => {
      const {watchFn, notifyFn} = functionLoaderFn({id, value})
      this._setAndWatchCache({id, notifyFn, value, watchFn})
    })
  }

  _setAndWatchCache({id, value, watchFn, notifyFn}) {
    const retVal = watchFn({id, notifyFn: this._onValueChanged.bind(this, {id})})
    const unsubscribeFn = retVal && retVal.unsubscribe ? retVal.unsubscribe : () => ({})

    this._cache[id] = {
      notifyFn,
      unsubscribeFn,
      value
    }
  }

  _onValueChanged({id}) {
    const {unsubscribeFn, notifyFn, value} = this._cache[id]
    delete this._cache[id]
    unsubscribeFn({oldValue: value})
    notifyFn()
  }
}
