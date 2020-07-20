import * as core from '@actions/core'
import {lint} from 'repolinter'
import * as path from 'path'

async function run(): Promise<void> {
  try {
    const result = lint(path.resolve('.'))
    core.debug(JSON.stringify(result))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
