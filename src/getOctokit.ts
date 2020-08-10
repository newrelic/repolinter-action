import {Octokit} from '@octokit/action'
import {retry} from '@octokit/plugin-retry'

const MyOcktokit = Octokit.plugin(retry)

export default MyOcktokit
