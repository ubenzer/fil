// noinspection NpmUsedModulesInstalled
import deepIterator from 'deep-iterator'
import dotProp from 'dot-prop-immutable'
import {fsPromise} from './misc'
import path from 'path'
import sanitize from 'sanitize-filename'

const pathForCacheItem = ({cachePath, id, type, keyPath}) => {
  const idParts = id.split(/(?:\/|\\|\||@|:)+/)
  const sanitizedPathParts = [...idParts, `${type}--${keyPath.join('--')}`]
    .map((ip) => sanitize(ip, {replacement: '_'}))

  return path.join(cachePath, ...sanitizedPathParts)
}

const binaryItemsToDisk = async ({id, type, json, cachePath, accountingKey}) => {
  if (!json) { return json }

  // noinspection JSUnusedGlobalSymbols
  const iterator = deepIterator(json, {
    onlyLeaves: true,
    // without this, iterator traverses whole Buffer byte by byte
    skipIteration: (node) => node.value instanceof Buffer
  })

  // Determine paths to buffer typed keys
  const binaryFields = []
  for (const {path: p, value} of iterator) {
    if (value instanceof Buffer) {
      binaryFields.push({path: p, value})
    }
  }
  const newJson = binaryFields.reduce((acc, {path: p}) => dotProp.delete(acc, p), json)
  newJson[accountingKey] = binaryFields.map((bf) => bf.path)

  await Promise.all(binaryFields.map(({value, path: p}) => {
    const filePath = pathForCacheItem({cachePath, id, keyPath: p, type})
    // noinspection JSUnresolvedFunction
    return fsPromise.outputFileAsync(filePath, value)
  }))

  return newJson
}

const binaryItemsFromDisk = async ({id, type, json, cachePath, accountingKey}) => {
  if (!json) { return json }

  const binaryFields = json[accountingKey] || []
  const binaryPaths = binaryFields.map((bf) => pathForCacheItem({cachePath, id, keyPath: bf, type}))
  // noinspection JSUnresolvedFunction
  const binaryDataArr = await Promise.all(binaryPaths.map((bp) => fsPromise.readFileAsync(bp)))
  const newJson = binaryDataArr.reduce((acc, bd, idx) => dotProp.set(acc, binaryFields[idx], bd), json)
  delete newJson[accountingKey]
  return newJson
}

const clearBinaryItemsFromDisk = async ({id, type, json, cachePath, accountingKey}) => {
  if (!json) { return json }

  const binaryFields = json[accountingKey] || []
  const binaryPaths = binaryFields.map((bf) => pathForCacheItem({cachePath, id, keyPath: bf, type}))
  // noinspection JSUnresolvedFunction
  return Promise.all(binaryPaths.map((bp) => fsPromise.removeAsync(bp)))
}

const binaryCacheTypes = {
  childrenArgs: 'childrenArgs',
  content: 'content',
  contentArgs: 'contentArgs',
  handlesArgs: 'handlesArgs'
}

export {binaryItemsToDisk, binaryItemsFromDisk, clearBinaryItemsFromDisk, binaryCacheTypes}
