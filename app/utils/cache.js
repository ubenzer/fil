const {deepMap} = require('./misc')
const fs = require('fs-extra')
const path = require('path')
const uuidV1 = require('uuid/v1')
const debugc = require('debug')

const debug = debugc('fil:cache')
const serializedValuePrefix = '@@SERIALIZED@@'
const filFieldPrefix = '@@FIL@@'
const hashFileName = 'hash.txt'

const readHash = async ({cachePath}) => fs.readFile(path.join(cachePath, hashFileName), 'utf-8')
const writeHash = async ({cachePath, hash}) => fs.outputFile(path.join(cachePath, hashFileName), hash)
const clearCache = async ({cachePath}) => fs.emptyDir(cachePath)

const pathForCacheItem = ({uuid}) => path.join(uuid[0], uuid[1], uuid[2], uuid[3], uuid[4], uuid)

const writeCache = async ({key, items, cachePath}) => {
  if (!items) {
    debug('Object provided to writeCache is not an object')
    return
  }

  // name: relative file path in cache; buffer: actual buffer to be written
  const toDisk = []

  const finalJson = await Promise.all(
    Object.keys(items).map(async (itemKey) => {
      const object = {...items[itemKey]}
      const isDirty = delete object[`${filFieldPrefix}dirty`] === true
      delete object[`${filFieldPrefix}dirty`]

      // uuid, type, value
      const serializedFieldsInfo = []

      if (isDirty) {
        delete object[`${filFieldPrefix}original`]

        const json = deepMap(object, (value) => {
          if (value instanceof Buffer) {
            const uuid = uuidV1()
            const filePath = pathForCacheItem({uuid})
            toDisk.push({
              buffer: value,
              name: filePath
            })
            serializedFieldsInfo.push({
              type: 'buffer',
              uuid,
              value: filePath
            })
            return `${serializedValuePrefix}${uuid}`
          }

          if (value instanceof Date) {
            const uuid = uuidV1()
            serializedFieldsInfo.push({
              type: 'date',
              uuid,
              value: value.toJSON()
            })
            return `${serializedValuePrefix}${uuid}`
          }

          return value
        })

        await Promise.all(
          toDisk.map(({name, buffer}) => {
            const fullPath = path.join(cachePath, name)
            return fs.outputFile(fullPath, buffer)
          })
        )

        return {
          itemKey,
          json,
          serializedFieldsInfo
        }
      }

      return object[`${filFieldPrefix}original`]
    })
  )

  const fullPath = path.join(cachePath, `${key}.json`)
  await fs.outputJson(fullPath, finalJson)
}

const readCache = async ({key, cachePath}) => {
  const filePath = path.join(cachePath, `${key}.json`)
  let fileContents = null
  try {
    fileContents = await fs.readFile(filePath, 'utf8')
    fileContents = JSON.parse(fileContents)
    if (!Array.isArray(fileContents)) {
      debug('Object read from disk does not contain an array')
      throw new Error('no an array')
    }
  } catch (e) {
    return null
  }

  const cache =
    (await Promise.all(
      fileContents.map(async ({itemKey, json, serializedFieldsInfo}) => {
        const serializedFieldData = (await Promise.all(
          serializedFieldsInfo
            .map(async ({uuid, value, type}) => {
              if (type === 'buffer') {
                const fullPath = path.join(cachePath, value)
                const fcontents = await fs.readFile(fullPath)
                return {type, uuid, value: fcontents}
              }

              if (type === 'date') {
                return {type, uuid, value: new Date(value)}
              }

              throw new Error(`Unknown type ${type} on cache uuid ${uuid}`)
            })
        )).reduce((acc, sfi) => ({
          ...acc,
          [sfi.uuid]: {
            type: sfi.type,
            value: sfi.value
          }
        }), {})

        const originalCacheObject = deepMap(json, (value) => {
          if (!(typeof value === 'string' && value.startsWith(serializedValuePrefix))) { return value }
          const uuid = value.substr(serializedValuePrefix.length)
          return serializedFieldData[uuid].value
        })
        const cacheObject = {...originalCacheObject}
        cacheObject[`${filFieldPrefix}dirty`] = false
        cacheObject[`${filFieldPrefix}original`] = originalCacheObject

        return {
          cacheObject,
          itemKey
        }
      })
    )).reduce((acc, {itemKey, cacheObject}) => ({
      ...acc,
      [itemKey]: cacheObject
    }), {})

  return cache
}

const markCacheItemAsDirty = (item) => {
  const clone = {...item}
  clone[`${filFieldPrefix}dirty`] = true
  delete clone[`${filFieldPrefix}original`]
  return clone
}


module.exports = {clearCache, markCacheItemAsDirty, readCache, readHash,
  writeCache, writeHash}
