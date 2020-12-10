import * as core from '@actions/core'
import {spawnSync} from 'child_process'
import run from './main'


/**
 * @fileoverview This file serves as the "entry"
 * you can check out main.ts for the actual
 * "main" function.
 */

// debugging
core.debug(JSON.stringify(process.env))
const output = spawnSync('licensee', ['version'])
core.debug(JSON.stringify(output.stdout?.toString?.()))
core.debug(JSON.stringify(output.stderr?.toString?.()))
const output2 = spawnSync('github-linguist', ['--help'])
core.debug(JSON.stringify(output2.stdout?.toString?.()))
core.debug(JSON.stringify(output2.stderr?.toString?.()))


run()
