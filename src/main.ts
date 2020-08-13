import * as core from '@actions/core'
import Octokit from './getOctokit'
import {Inputs, Outputs} from './inputs'
import {
  lint,
  resultFormatter,
  markdownFormatter,
  jsonFormatter
} from 'repolinter'
import getConfig from './getConfig'
import createOrUpdateIssue from './createorUpdateIssue'

function getInputs(): {[key: string]: string} {
  return {
    TOKEN: core.getInput(Inputs.TOKEN),
    CONFIG_URL: core.getInput(Inputs.CONFIG_URL),
    CONFIG_FILE: core.getInput(Inputs.CONFIG_FILE),
    REPO: core.getInput(Inputs.REPO, {required: true}),
    OUTPUT_TYPE: core.getInput(Inputs.OUTPUT_TYPE, {required: true}),
    OUTPUT_NAME: core.getInput(Inputs.OUTPUT_NAME, {required: true}),
    LABEL_NAME: core.getInput(Inputs.LABEL_NAME, {required: true}),
    LABEL_COLOR: core.getInput(Inputs.LABEL_COLOR, {required: true})
  }
}

export default async function run(disableRetry?: boolean): Promise<void> {
  // load the configuration from file or url, depending on which one is configured
  try {
    // get all inputs
    const {
      TOKEN,
      CONFIG_FILE,
      CONFIG_URL,
      REPO,
      OUTPUT_TYPE,
      OUTPUT_NAME,
      LABEL_NAME,
      LABEL_COLOR
    } = getInputs()
    // verify the output type is correct
    if (OUTPUT_TYPE !== 'exit-code' && OUTPUT_TYPE !== 'issue')
      throw new Error(`Invalid output paramter value ${OUTPUT_TYPE}`)
    // verify the label name is a string
    if (!LABEL_NAME) throw new Error(`Invalid label name value ${LABEL_NAME}`)
    // verify the label color is a color
    if (!/[0-9a-fA-F]{6}/.test(LABEL_COLOR))
      throw new Error(`Invalid label color ${LABEL_COLOR}`)
    // override GITHUB_TOKEN and INPUT_GITHUB_TOKEN if TOKEN is present
    if (TOKEN) {
      delete process.env['INPUT_GITHUB_TOKEN']
      process.env['GITHUB_TOKEN'] = TOKEN
    }
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
    // if repolinter errored, set failed
    if (result.errored)
      core.setFailed(`Repolinter failed with error: ${result.errMsg}`)
    else if (OUTPUT_TYPE === 'exit-code') {
      // else output the exit code
      if (!result.passed) core.setFailed('Repolinter ruleset did not pass.')
      else process.exitCode = 0
    } else if (OUTPUT_TYPE === 'issue') {
      // else output an issue, and don't set the exit code
      const octokit = new Octokit({
        request: disableRetry ? {retries: 0} : undefined,
        log: {
          debug: core.debug,
          info: core.info,
          warn: core.warning,
          error: core.error
        }
      })
      octokit.hook.before('request', options =>
        core.debug(`${options.method} ${options.url}`)
      )

      const [owner, repo] = REPO.split('/')
      const issueContent = markdownFormatter.formatOutput(result, true)
      // create an issue!
      core.startGroup('Creating/Updating Issue')
      await createOrUpdateIssue(octokit, {
        owner,
        repo,
        issueName: OUTPUT_NAME,
        issueContent,
        labelName: LABEL_NAME,
        labelColor: LABEL_COLOR,
        shouldClose: result.passed === true
      })
      core.endGroup()
      process.exitCode = 0
    }
    // set the outputs for this action
    core.setOutput(Outputs.ERRORED, false)
    core.setOutput(Outputs.PASSED, result.passed)
    core.setOutput(
      Outputs.JSON_OUTPUT,
      jsonFormatter.formatOutput(result, true)
    )
  } catch (error) {
    // set the outputs for this action
    core.setOutput(Outputs.ERRORED, true)
    core.setOutput(Outputs.PASSED, false)
    core.setFailed('A fatal error was thrown.')
    core.error(error as Error)
    if (error.stack) core.error(error.stack)
  }
}
