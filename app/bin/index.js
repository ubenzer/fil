import "source-map-support/register"
import {ProjectRunner} from "../projectRunner"
import exitHook from "async-exit-hook"
import fs from "fs-extra"
import npid from "npid"
import parseArgs from "minimist"
import path from "path"

/* eslint-disable no-console */
console.info("=== Fil ===")
console.info(`Running using node ${process.version}`)

const argv = parseArgs(process.argv, {boolean: ["dynamic", "force", "nocache", "headers"]})

const projectRootFile = require(path.join(process.cwd(), "index.js")).default
// noinspection JSUnresolvedVariable
const projectRunner = new ProjectRunner({
  listenToChanges: argv.dynamic,
  outputHeaders: argv.headers,
  project: projectRootFile,
  useCache: !argv.nocache
})

const pidFolder = path.join(process.cwd(), projectRootFile.cachePath())

fs.ensureDirSync(pidFolder) // eslint-disable-line no-sync

const pid = npid.create(path.join(pidFolder, "running.pid"), argv.force)

exitHook((callback) => {
  projectRunner.persistCache()
    .catch((e) => {
      console.error(e)
      pid.remove()
      callback()
    })
    .then(() => {
      console.info("Bye!")
      pid.remove()
      callback()
    })
})

projectRunner.init()
  .then(() => {
    if (argv.dynamic) {
      return projectRunner.generateDynamic()
    }
    return projectRunner.generateStatic()
  })
  .catch(console.error)
