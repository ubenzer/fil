import fs from 'fs-extra'
import path from 'path'

const fileName = 'hash.txt'

const readHash = async ({cachePath}) => fs.readFile(path.join(cachePath, fileName), 'utf-8')
const writeHash = async ({cachePath, hash}) => fs.outputFile(path.join(cachePath, fileName), hash)

const clearCache = async ({cachePath}) => fs.emptyDir(cachePath)
export {readHash, writeHash, clearCache}
