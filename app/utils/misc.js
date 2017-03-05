import Promise from "bluebird"
import fs from "fs-extra"
import path from "path"

// noinspection JSUnresolvedFunction
const fsPromise = Promise.promisifyAll(fs)

const getFoldersIn = async (p) => {
  // noinspection JSUnresolvedFunction
  const allFiles = await fsPromise.readdirAsync(p)
  return allFiles.filter((f) => fs.statSync(path.join(p, f)).isDirectory()) // eslint-disable-line no-sync
}

// https://gist.github.com/spion/8c9d8556697ed61108177164e90fb50d
const translateError = (e) => e

export {getFoldersIn, fsPromise, translateError}
