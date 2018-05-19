const Rx = require('rxjs')
const isPlainObject = require('lodash.isplainobject')

// https://gist.github.com/spion/8c9d8556697ed61108177164e90fb50d
const translateError = (e) => e

const mapObject = (obj, fn) =>
  Object.keys(obj).reduce(
    (acc, key) => {
      acc[key] = fn(obj[key])
      return acc
    },
    {}
  )

const deepMap = (obj, fn) => {
  if (Array.isArray(obj)) {
    return obj.map((val) => deepMap(val, fn))
  }

  if (isPlainObject(obj)) {
    return mapObject(obj, (val) => deepMap(val, fn))
  }

  return fn(obj)
}

const toObservable = (fn) => {
  if (!fn) {
    return Rx.empty()
  }

  return Rx.Observable.create((subscriber) => {
    const notifyFn = () => {
      subscriber.next()
    }
    const retVal = fn({notifyFn})
    const unsubscribeFn = retVal && retVal.unsubscribe ? retVal.unsubscribe : () => ({})

    return () => unsubscribeFn()
  })
}

module.exports = {deepMap, toObservable, translateError}
