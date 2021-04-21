import fetch from 'node-fetch'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import {validateConfig} from 'repolinter'

/**
 * Load a repolinter configuration from either a file or URL, return the
 * validated deserialized configuration.
 *
 * @param where.configFile The file path to the config, relative to the current
 *   working directory. Mutually exclusive with where.configUrl.
 * @param where.configUrl The URL to load fhe config from. Mutually exclusive
 *   with where.configFile
 * @returns A deserialized JSON or YAML configuration object if one was found.
 *   If the configuration does not exist or does not pass validation this
 *   function will throw an error.
 */
export default async function getConfig(where: {
  configFile?: string
  configUrl?: string
}): Promise<Record<string, unknown> | null> {
  // get the config file contents
  let contents
  if (where.configFile) {
    core.debug(`Reading config file ${where.configFile}`)
    // read the file
    try {
      contents = await fs.promises.readFile(where.configFile, 'utf8')
    } catch {
      throw new Error(`Unable to open file ${where.configFile}`)
    }
  } else if (where.configUrl) {
    core.debug(`Reading config url ${where.configUrl}`)
    // fetch the data from the URL
    try {
      const res = await fetch(where.configUrl)
      if (!res.ok) {
        throw new Error(
          `Failed to fetch from ${where.configUrl} with status code ${res.status} (${res.statusText})`
        )
      }
      contents = await res.text()
    } catch (e) {
      throw new Error(
        `Got error when retrieving data from ${
          where.configUrl
        }: ${e.toString()}`
      )
    }
  }
  // if neither parameters are present, return null
  else {
    core.debug('Using default config')
    return null
  }
  // attempt to parse both JSON and YAML
  let ret = null
  let jsonError
  let yamlError
  try {
    ret = JSON.parse(contents)
  } catch (e) {
    jsonError = e
  }
  if (!ret) {
    try {
      ret = yaml.load(contents, {schema: yaml.JSON_SCHEMA})
    } catch (e) {
      yamlError = e
    }
  }
  // throw if neither worked
  if (!ret) {
    throw new Error(
      `Unable to parse JSON/YAML from file ${
        where.configFile
      } with error JSON error "${
        jsonError && jsonError.toString()
      }" and YAML error "${yamlError && yamlError.toString()}"`
    )
  }
  // validate the config using repolinters validator
  const validationResult = await validateConfig(ret)
  if (!validationResult.passed) {
    throw new Error(
      `Configuration validation failed with error ${validationResult.error}`
    )
  }
  return ret
}
