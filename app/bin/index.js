#!/usr/bin/env node
const {Project} = require('../project')
const fs = require('fs-extra')
const npid = require('npid')
const parseArgs = require('minimist')
const path = require('path')
const readline = require('readline')
const {DynamicRenderer} = require('../renderer/dynamic')
const {StaticRenderer} = require('../renderer/static')

/* eslint-disable no-console */
console.info('=== Fil ===')
console.info(`Running using node ${process.version}`)

const argv = parseArgs(process.argv, {boolean: ['dynamic', 'force', 'nocache']})

const projectRootFile = require(path.join(process.cwd(), 'index.js'))

const project = new Project({
  listenToChanges: argv.dynamic,
  project: projectRootFile,
  useCache: !argv.nocache
})

const pidFolder = path.join(process.cwd(), projectRootFile.cachePath)

fs.ensureDirSync(pidFolder) // eslint-disable-line no-sync

const pid = npid.create(path.join(pidFolder, 'running.pid'), argv.force)
process.exitCode = 0

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
  project.persistCache()
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

project.init()
  .then(() => {
    if (argv.dynamic) {
      return new DynamicRenderer({project}).serve()
        .then(() => new Promise(() => {
          // prevent resolving forever.
        }))
    }
    return new StaticRenderer({project}).render()
  })
  .catch((e) => {
    console.trace(e)
    process.exitCode = 2
  })
  .then(cleanup)
  .then(() => {
    if (process.exitCode !== 0) {
      process.exit(process.exitCode) // eslint-disable-line no-process-exit
    }
  })
