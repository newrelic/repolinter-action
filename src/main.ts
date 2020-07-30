import * as core from '@actions/core'
import * as github from '@actions/github'
import {Inputs} from './inputs'
import {lint, resultFormatter, markdownFormatter} from 'repolinter'
import getConfig from './getConfig'

function getInputs(): {[key: string]: string} {
  return {
    CONFIG_URL: core.getInput(Inputs.CONFIG_URL),
    CONFIG_FILE: core.getInput(Inputs.CONFIG_FILE),
    TOKEN: core.getInput(Inputs.TOKEN, {required: true}),
    REPO: core.getInput(Inputs.REPO, {required: true}),
    OUTPUT_TYPE: core.getInput(Inputs.OUTPUT_TYPE, {required: true})
  }
}

async function run(): Promise<void> {
  // load the configuration from file or url, depending on which one is configured
  try {
    // get all inputs
    const {CONFIG_FILE, CONFIG_URL, TOKEN, REPO, OUTPUT_TYPE} = getInputs()
    // verify the output type is correct
    if (OUTPUT_TYPE !== 'off' && OUTPUT_TYPE !== 'issue')
      return core.setFailed(`Invalid output paramter value ${OUTPUT_TYPE}`)
    // get the config
    const config = await getConfig({
      configFile: CONFIG_FILE,
      configUrl: CONFIG_URL
    })
    // run the linter!
    const result = await lint('.', undefined, true, config)
    core.debug(JSON.stringify(result))
    // print the formatted result
    core.startGroup('Repolinter Output')
    core.info(resultFormatter.formatOutput(result, true))
    core.endGroup()
    if (result.errored)
      throw new Error(`Repolinter failed with error: ${result.errMsg}`)
    // if the result is not a pass or an error, open an issue
    // TODO: what to do if the run errors
    // TODO: automatically create the repolinter label
    if (!result.passed && OUTPUT_TYPE === 'issue') {
      const octokit = github.getOctokit(TOKEN)
      const [owner, repo] = REPO.split('/')

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
