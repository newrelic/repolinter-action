import * as core from '@actions/core'
import {spawnSync} from 'child_process'
import run from './main'


/**
 * @fileoverview This file serves as the "entry"
 * you can check out main.ts for the actual
 * "main" function.
 */

function debugCmd(cmd: string): void {
  const [cmd_val, ...args] = cmd.split(' ')
  const output = spawnSync(cmd_val, args)
  core.debug(`${cmd}: ${output.error || ''}`)
  core.debug(JSON.stringify(output.stdout?.toString?.()))
  core.debug(JSON.stringify(output.stderr?.toString?.()))
}

// debugging
core.debug(JSON.stringify(process.env))
debugCmd('licensee version')
debugCmd('github-linguist --help')
debugCmd('ls -lah /usr/local/lib/ruby/gems/2.6.0/bin')
debugCmd('bundle platform')
debugCmd('bundle list')

run()
