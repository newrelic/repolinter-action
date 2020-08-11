import {Octokit as ActionKit} from '@octokit/action'
import {retry} from '@octokit/plugin-retry'

// strip plugin types to make testing easier
const MyOctokit = ActionKit.plugin(retry)

export default MyOctokit
