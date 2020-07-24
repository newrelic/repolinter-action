import * as core from '@actions/core'
import {lint} from 'repolinter'
import fetch from 'node-fetch'
import * as fs from 'fs'

const INPUT_CONFIG_URL = 'config-url'
const INPUT_CONFIG_FILE = 'config-file'

async function getConfig(
  configFile: string | null,
  configUrl: string | null
): Promise<object | null> {
  // get the config file contents
  let contents
  if (configFile) {
    core.debug(`Reading config file ${configFile}`)
    // read the file
    try {
      contents = await fs.promises.readFile(configFile, 'utf8')
    } catch {
      throw new Error(`Unable to open file ${configFile}`)
    }
  } else if (configUrl) {
    core.debug(`Reading config url ${configUrl}`)
    // fetch the data from the URL
    try {
      const res = await fetch(configUrl)
      if (!res.ok) {
        throw new Error(
          `Failed to fetch from ${configUrl} with status code ${res.status} (${res.statusText})`
        )
      }
      contents = await res.text()
    } catch (e) {
      throw new Error(
        `Got error when retrieving data from ${configUrl}: ${e.toString()}`
      )
    }
  }
  // if neither parameters are present, return null
  else {
    core.debug('Using default config')
    return null
  }
  // parse it
  let ret
  try {
    ret = JSON.parse(contents)
  } catch (e) {
    throw new Error(
      `Unable to parse JSON from file ${configFile} with error ${e.toString()}`
    )
  }
  // validate that ret is an object
  if (!ret || Array.isArray(ret)) {
    throw new Error(`Invalid JSON found in file ${configFile}`)
  }
  return ret
}

async function run(): Promise<void> {
  // load the configuration from file or url, depending on which one is configured
  let config
  try {
    config = await getConfig(
      core.getInput(INPUT_CONFIG_FILE),
      core.getInput(INPUT_CONFIG_URL)
    )
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
