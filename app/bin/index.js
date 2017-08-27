#!/usr/bin/env node
// import "source-map-support/register"
import {ProjectRunner} from '../projectRunner'
import fs from 'fs-extra'
import npid from 'npid'
import parseArgs from 'minimist'
import path from 'path'
import readline from 'readline'

/* eslint-disable no-console */
console.info('=== Fil ===')
console.info(`Running using node ${process.version}`)

const argv = parseArgs(process.argv, {boolean: ['dynamic', 'force', 'nocache', 'headers']})

const projectRootFile = require(path.join(process.cwd(), 'index.js'))
// noinspection JSUnresolvedVariable
const projectRunner = new ProjectRunner({
  listenToChanges: argv.dynamic,
  outputHeaders: argv.headers,
  project: projectRootFile,
  useCache: !argv.nocache
})

const pidFolder = path.join(process.cwd(), projectRootFile.cachePath)

fs.ensureDirSync(pidFolder) // eslint-disable-line no-sync

const pid = npid.create(path.join(pidFolder, 'running.pid'), argv.force)

if (process.platform === 'win32') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.on('SIGINT', () => {
    process.emit('SIGINT')
  })
}

const cleanup = async () =>
  projectRunner.persistCache()
    .catch((e) => {
      console.error(e)
      process.exitCode = 1
    })
    .then(() => {
      pid.remove()
    })

let sigintInProgress = false
process.on('SIGINT', () => {
  if (sigintInProgress) {
    console.log('Dude, shutdown is already in progress... Get a faster machine or calm down.')
    return
  }
  sigintInProgress = true
  console.log('Preparing to shutdown...')
  cleanup()
    .then(() => {
      // If we are in dynamic serving SIGINT is the correct way to exit.
      process.exit(argv.dynamic ? 0 : 4) // eslint-disable-line no-process-exit
    })
    .catch(() => {
      process.exit(3) // eslint-disable-line no-process-exit
    })
})

projectRunner.init()
  .then(() => {
    if (argv.dynamic) {
      return projectRunner.generateDynamic()
        .then(() => new Promise(() => {
          // prevent resolving forever.
        }))
    }
    return projectRunner.generateStatic()
  })
  .catch((e) => {
    console.error(e)
    process.exitCode = 2
  })
  .then(cleanup)
  .then(() => {
    if (process.exitCode !== 0) {
      process.exit(process.exitCode) // eslint-disable-line no-process-exit
    }
  })
