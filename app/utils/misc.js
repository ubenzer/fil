import isPlainObject from 'lodash.isplainobject'

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

export {deepMap, translateError}
