#!/usr/bin/env node
// /* eslint-disable global-require */
require('babel-register')
const Jasmine = require('jasmine')

const jasmine = new Jasmine()
jasmine.loadConfigFile('spec/support/jasmine.json')
jasmine.execute()
