import * as core from '@actions/core'
import Octokit from './getOctokit'
import {Inputs} from './inputs'
import {lint, resultFormatter, markdownFormatter} from 'repolinter'
import getConfig from './getConfig'
import createOrUpdateIssue from './createorUpdateIssue'

function getInputs(): {[key: string]: string} {
  return {
    CONFIG_URL: core.getInput(Inputs.CONFIG_URL),
    CONFIG_FILE: core.getInput(Inputs.CONFIG_FILE),
    REPO: core.getInput(Inputs.REPO, {required: true}),
    OUTPUT_TYPE: core.getInput(Inputs.OUTPUT_TYPE, {required: true}),
    OUTPUT_NAME: core.getInput(Inputs.OUTPUT_NAME, {required: true}),
    LABEL_NAME: core.getInput(Inputs.LABEL_NAME, {required: true}),
    LABEL_COLOR: core.getInput(Inputs.LABEL_COLOR, {required: true})
  }
}

async function run(): Promise<void> {
  // load the configuration from file or url, depending on which one is configured
  try {
    // get all inputs
    const {
      CONFIG_FILE,
      CONFIG_URL,
      REPO,
      OUTPUT_TYPE,
      OUTPUT_NAME,
      LABEL_NAME,
      LABEL_COLOR
    } = getInputs()
    // verify the output type is correct
    if (OUTPUT_TYPE !== 'off' && OUTPUT_TYPE !== 'issue')
      return core.setFailed(`Invalid output paramter value ${OUTPUT_TYPE}`)
    // verify the label name is a string
    if (!LABEL_NAME)
      return core.setFailed(`Invalid label name value ${LABEL_NAME}`)
    // verify the label color is a color
    if (!/[0-9a-fA-F]{6}/.test(LABEL_COLOR))
      return core.setFailed(`Invalid label color ${LABEL_COLOR}`)
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
    if (OUTPUT_TYPE === 'issue') {
      const octokit = new Octokit()
      const [owner, repo] = REPO.split('/')
      const issueContent = markdownFormatter.formatOutput(result, true)

      await createOrUpdateIssue(octokit, {
        owner,
        repo,
        issueName: OUTPUT_NAME,
        issueContent,
        labelName: LABEL_NAME,
        labelColor: LABEL_COLOR,
        shouldClose: result.passed === true
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
