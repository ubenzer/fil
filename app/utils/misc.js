import Promise from "bluebird"
import fs from "fs-extra"

// noinspection JSUnresolvedFunction
const fsPromise = Promise.promisifyAll(fs)

// https://gist.github.com/spion/8c9d8556697ed61108177164e90fb50d
const translateError = (e) => e

export {fsPromise, translateError}
