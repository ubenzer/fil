import {fsPromise} from './misc'
import path from 'path'

const fileName = 'hash.txt'

const readHash = async ({cachePath}) => fsPromise.readFileAsync(path.join(cachePath, fileName), 'utf-8')
const writeHash = async ({cachePath, hash}) => fsPromise.outputFileAsync(path.join(cachePath, fileName), hash)

const clearCache = async ({cachePath}) => fsPromise.emptyDirAsync(cachePath)
export {readHash, writeHash, clearCache}
