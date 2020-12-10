import {Octokit as ActionKit} from '@octokit/action'
import {retry} from '@octokit/plugin-retry'

/**
 * @file This file serves as a centralized location to setup Octokit with the
 *     appropriate plugins and authentication. All Octokit instances in this
 *     action should come from this file to prevent type conflicts.
 */

// strip plugin types to make testing easier
const MyOctokit = ActionKit.plugin(retry)

export default MyOctokit
