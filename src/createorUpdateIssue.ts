import * as core from '@actions/core'
import {
  RequestError,
  IssuesListForRepoResponseData,
  IssuesCreateResponseData,
  IssuesUpdateResponseData
} from '@octokit/types'
import Octokit from './getOctokit'

export interface CreateOrUpdateIssueOpts {
  owner: string
  repo: string
  issueName: string
  issueContent?: string
  issueAssignee?: string
  labelName: string
  labelColor: string
  shouldClose?: boolean
  forceCreateIssue?: boolean
}

type Octo = InstanceType<typeof Octokit>

/**
 * @brief Create or update a single up-to-date issue wit the latest output
 * from the repolinter action.
 *
 * This function exists to limit the number of issues created by this
 * action to the fewest possible, instead opting to quietly update the
 * content of the existing issue (if one is present). This function
 * uses a specific label (options.labelName) as well as verifying that
 * the issue was created by the user this action is impersonating (usually
 * github-actions-bot).
 *
 * @note options.labelName should be a label that is unique to the repolinter action, otherwise
 * there is a small chance this function may attempt to edit other people's issues.
 *
 * @param options.owner The owner of the repository to create an issue on
 * @param options.repo The repository to create the issue on
 * @param options.issueContent The text content to use for the issue body (ex. the markdown output of repolinter).
 * @param options.issueName The name to use for this issue
 * @param options.issueAssignee The username to assign this issue to, falsey for no one.
 * @param options.labelName The name of the label to use to track issues opened by this bot.
 * @param options.labelColor The color to use when creating this label (this value will be ignored if the label already exists).
 * Should be a hex string with no prefix (ex. "ff2a63").
 * @param options.shouldClose Set this to true to close the issue. If this value is true and
 * no issue exists, this function will do nothing.
 * @param options.forceCreateIssue Set to truthy to always create a new issue, instead of editing the old one. The old issue
 * will automatically be closed if found.
 * @returns The issue number of the created issue, or null if no issue was created.
 */
export default async function createOrUpdateIssue(
  client: Octo,
  options: CreateOrUpdateIssueOpts
): Promise<number | null> {
  // error check
  if (options.forceCreateIssue && options.shouldClose)
    throw new Error(`Both forceCreateIssue and shouldClose cannot be set!`)
  // get the current username
  const context = await client.users.getAuthenticated()
  // attempt to find an issue created by Repolinter
  const issue = await findRepolinterIssue(
    client,
    Object.assign({}, options, {selfUsername: context.data.login})
  )
  // if no issue exists and we should close the issue, exit and do nothing
  if (!issue && options.shouldClose) {
    core.debug(`No issue was found and shouldClose is set, doing nothing.`)
    return null
  }
  let res
  if (!issue || options.forceCreateIssue) {
    // if an old issue is present, close it
    if (issue)
      await updateRepolinterIssue(client, {
        issueNumber: issue.number,
        owner: options.owner,
        repo: options.repo,
        shouldClose: true
      })
    // create a new issue
    res = await createRepolinterIssue(client, options)
    core.info(`Created issue #${res.number}`)
  } else {
    // update the existing issue
    res = await updateRepolinterIssue(
      client,
      Object.assign({}, options, {issueNumber: issue.number})
    )
    core.info(
      options.shouldClose
        ? `Closed issue #${res.number}`
        : `Updated issue #${res.number}`
    )
  }
  return res.number
}

export interface FindRepolinterIssueOpts {
  owner: string
  repo: string
  labelName: string
  selfUsername: string
}

/**
 * Find the issue corresponding to this repolinter action instance, if
 * such an issue exists. If more than one issue matching the criteria
 * is found, the issue that was created soonest will be returned.
 *
 * @param client The authenticated octokit client to use
 * @param options.owner The owner of the repository to search
 * @param options.repo The name of the repository to search
 * @param labelName The label to filter repolinter issues by
 * @param selfUsername The current username of this octokit client.
 * Only issues created by this username will be enumerated.
 * @returns The issue data found, or null if no issue was found.
 */
export async function findRepolinterIssue(
  client: Octo,
  options: FindRepolinterIssueOpts
): Promise<IssuesListForRepoResponseData[number] | null> {
  // get the list of open issues on this repository
  const issues = await client.issues.listForRepo({
    owner: options.owner,
    repo: options.repo,
    state: 'open',
    creator: options.selfUsername,
    labels: options.labelName,
    sort: 'created',
    direction: 'desc'
  })
  // return none if there's no issue
  if (issues.data.length === 0) return null
  // omit a warning if there's more than one issue here
  if (issues.data.length > 1)
    core.warning(
      `Found more than one matching open issue: ${issues.data
        .map(i => `#${i.number}`)
        .join(', ')}. Defaulting to the most recent.`
    )
  // return the issue data!
  return issues.data[0]
}

export interface CreateRepolinterIssueOpts {
  owner: string
  repo: string
  issueName: string
  issueContent?: string
  issueAssignee?: string
  labelName: string
  labelColor: string
}

/**
 * Creates a label if one doesn't exists, then creates an issue
 * with that label and the specified content, assignee, and so on.
 *
 * @param client The authenticated octokit client to use
 * @param options.owner The owner of the repository the the issue will be created on
 * @param options.repo The name of the repository that the issue will be created on
 * @param options.issueName The title to use for the issue
 * @param options.issueContent The body of the issue, formatted as markdown (optional)
 * @param options.issueAssignee The username of the person to assign this issue to (optional)
 * @param options.labelName The name of the label to create/assign to this issue
 * @param options.labelColor The color to use when creating the label. This value will be ignored
 * if the label already exists.
 */
export async function createRepolinterIssue(
  client: Octo,
  options: CreateRepolinterIssueOpts
): Promise<IssuesCreateResponseData> {
  // create the label, if it doesn't exist
  try {
    await client.issues.getLabel({
      owner: options.owner,
      repo: options.repo,
      name: options.labelName
    })
  } catch (err) {
    if ((err as RequestError).status === 404) {
      core.debug(`Creating label ${options.labelName}`)
      await client.issues.createLabel({
        owner: options.owner,
        repo: options.repo,
        name: options.labelName,
        color: options.labelColor
      })
    } else throw err
  }
  core.debug(`Creating issue "${options.issueName}"...`)
  // create the issue
  const issue = await client.issues.create({
    owner: options.owner,
    repo: options.repo,
    title: options.issueName,
    body: options.issueContent,
    labels: [options.labelName],
    assignees:
      options.issueAssignee !== undefined ? [options.issueAssignee] : undefined
  })
  core.debug(`Successfully created issue #${issue.data.number}`)
  return issue.data
}

export interface UpdateReplolinterIssueOpts {
  repo: string
  owner: string
  issueNumber: number
  issueContent?: string
  shouldClose?: boolean
}

/**
 * Replace the body of a given issue with the specified value,
 * then close the issue if needed.
 *
 * @param client The authenticated Octokit client
 * @param options.owner The owner of the repository to update the issue on
 * @param options.repo The name of the repository to update the issue on
 * @param options.issueNumber The issue number to update (ex. #2, different from the ID)
 * @param options.issueContent The body to update the issue with, formatted as markdown. This will be ignored if the issue is being closed.
 * @param options.shouldClose Set this to true to close the issue, otherwise the issue
 * state will remain unchanged.
 * @returns The data returned by the REST API.
 */
export async function updateRepolinterIssue(
  client: Octo,
  options: UpdateReplolinterIssueOpts
): Promise<IssuesUpdateResponseData> {
  core.debug(`Updating issue ${options.issueNumber}`)
  if (options.shouldClose) core.debug(`Closing it!`)
  else core.debug(`Updating it with content "${options.issueContent}"`)
  // replace the issue body with the new one
  // we may choose to add a comment later but we can just update the body for now
  const res = await client.issues.update({
    owner: options.owner,
    repo: options.repo,
    issue_number: options.issueNumber,
    body: options.shouldClose ? undefined : options.issueContent,
    state: options.shouldClose ? 'closed' : undefined
  })
  return res.data
}
