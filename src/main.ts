import * as core from '@actions/core'
import {lint} from 'repolinter'
import getConfig from './getConfig'

const INPUT_CONFIG_URL = 'config-url'
const INPUT_CONFIG_FILE = 'config-file'

async function run(): Promise<void> {
  // load the configuration from file or url, depending on which one is configured
  let config
  try {
    config = await getConfig({
      configFile: core.getInput(INPUT_CONFIG_FILE),
      configUrl: core.getInput(INPUT_CONFIG_URL)
    })
  } catch (e) {
    return core.setFailed(e)
  }

  try {
    const result = await lint('.', undefined, true, config)
    core.debug(JSON.stringify(result))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
