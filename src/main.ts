import * as core from '@actions/core'
import * as github from '@actions/github'
import {lint, resultFormatter, markdownFormatter} from 'repolinter'
import getConfig from './getConfig'

const INPUT_CONFIG_URL = 'config-url'
const INPUT_CONFIG_FILE = 'config-file'
const INPUT_TOKEN = 'token'
const INPUT_REPO = 'repository'

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
    // print the formatted result
    core.startGroup('Repolinter Output')
    core.info(resultFormatter.formatOutput(result, true))
    core.endGroup()
    // if the result is not a pass or an error, open an issue
    // TODO: what to do if the run errors
    // TODO: automatically create the repolinter label
    if (!result.passed) {
      const octokit = github.getOctokit(
        core.getInput(INPUT_TOKEN, {required: true})
      )
      const [owner, repo] = core
        .getInput(INPUT_REPO, {required: true})
        .split('/')

      await octokit.issues.create({
        owner,
        repo,
        title: 'Open Source Policy Issues',
        body: markdownFormatter.formatOutput(result, true),
        labels: ['repolinter']
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
