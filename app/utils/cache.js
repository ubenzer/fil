import deepMap from 'deep-map'
import fs from 'fs-extra'
import path from 'path'
import uuidV1 from 'uuid/v1'

const serializedValuePrefix = '@@SERIALIZED@@'
const hashFileName = 'hash.txt'

const readHash = async ({cachePath}) => fs.readFile(path.join(cachePath, hashFileName), 'utf-8')
const writeHash = async ({cachePath, hash}) => fs.outputFile(path.join(cachePath, hashFileName), hash)
const clearCache = async ({cachePath}) => fs.emptyDir(cachePath)

const pathForCacheItem = ({uuid}) => path.join(uuid[0], uuid[1], uuid)

const writeObject = async ({key, object, cachePath}) => {
  if (!object) { return }

  // uuid, type, value
  const serializedFieldsInfo = []

  // name: relative file path in cache; buffer: actual buffer to be written
  const toDisk = []
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

  const finalJson = {
    json,
    serializedFieldsInfo
  }

  const fullPath = path.join(cachePath, `${key}.json`)
  await fs.outputJson(fullPath, finalJson)
}

const readObject = async ({key, cachePath}) => {
  const filePath = path.join(cachePath, `${key}.json`)
  let fileContents = null
  try {
    fileContents = await fs.readFile(filePath, 'utf8')
    fileContents = JSON.parse(fileContents)
  } catch (e) {
    return null
  }

  const serializedFieldsInfo = (await Promise.all(
    fileContents.serializedFieldsInfo
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

  const cacheObject = deepMap(fileContents.json, (value) => {
    if (!(typeof value === 'string' && value.startsWith(serializedValuePrefix))) { return value }
    const uuid = value.substr(serializedValuePrefix.length)
    return serializedFieldsInfo[uuid].value
  })

  return cacheObject
}

export {readHash, writeHash, clearCache, readObject, writeObject}
