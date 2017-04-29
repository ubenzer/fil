// noinspection NpmUsedModulesInstalled
import deepIterator from 'deep-iterator'
import dotProp from 'dot-prop-immutable'
import fs from 'fs-extra'

const dateFieldValuePrefix = '@@::DATE--->'

// https://gist.github.com/spion/8c9d8556697ed61108177164e90fb50d
const translateError = (e) => e

const toJSON = ({object}) => {
  // noinspection JSUnusedGlobalSymbols
  const iterator = deepIterator(object, {onlyLeaves: true})

  const dateFields = []
  for (const {path: p, value} of iterator) {
    if (value instanceof Date) {
      dateFields.push({path: p, value})
    }
  }
  const normalizedObject = dateFields.reduce((acc, {path: p, value}) => {
    const normalizedValue = `${dateFieldValuePrefix}${value.toJSON()}`
    return dotProp.set(acc, p, normalizedValue)
  }, object)

  return JSON.stringify(normalizedObject)
}

const fromJSON = ({string}) =>
  JSON.parse(string, (key, value) => {
    if (!(typeof value === 'string' && value.startsWith(dateFieldValuePrefix))) { return value }
    const stringDate = value.substr(dateFieldValuePrefix.length)
    return new Date(stringDate)
  })

const readSafeJSON = async ({path: p}) => {
  const fileContents = await fs.readFile(p, 'utf8')
  return fromJSON({string: fileContents})
}

const writeSafeJSON = async ({path: p, object}) => {
  const jsonString = toJSON({object})
  return fs.outputFile(p, jsonString)
}

export {translateError, readSafeJSON, writeSafeJSON}
