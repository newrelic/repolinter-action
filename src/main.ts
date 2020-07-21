import * as core from '@actions/core'
import {lint} from 'repolinter'

async function run(): Promise<void> {
  try {
    const result = await lint('.')
    core.debug(JSON.stringify(result))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
