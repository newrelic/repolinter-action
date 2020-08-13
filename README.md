[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

# Repolinter Action v1 [build badges go here when available]

This action runs [Repolinter](https://github.com/todogroup/repolinter) on your repository. Optionally you can also configure this tool to create GitHub issues with the Repolinter output.

## Inputs

```yaml
- uses: repolinter-action@v1
  with:
    # A path to the JSON Repolinter ruleset to use, relative to the workflow
    # working directory (i.e. under `$GITHUB_WORKSPACE`).
    # 
    # This option is mutually exclusive with config-url. If this option and 
    # config-url are not specified, Repolinter's default ruleset will be used.
    config-file: ''

    # A URL to pull the JSON Repolinter ruleset from. This URL must be accessible
    # by the actions runner and return raw JSON file on GET.
    #
    # This option can be used to pull a ruleset from GitHub using the
    # raw.githubusercontent.com URL (ex. https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter-newrelic-communityplus.json).
    #
    # This option is mutually exclusive with config-file. If this option and 
    # config-file are not specified, Repolinter's default ruleset will be used.
    config-url: ''

    # Where repolinter-action should put the linting results. There are two
    # options available:
    # * "exit-code": repolinter-action will print the lint output to the console
    #   and set the exit code to result.passed. This output type is most useful for
    #   PR status checks.
    # * "issue": repolinter-action will create a GitHub issue on the current
    #   repository with the repolinter output and always exit 0. See the README for
    #   more details on issue outputting behavior. This output type is ideal for 
    #   non-intrusive notification.
    # 
    # Default: "exit-code"
    output-type: ''

    # The title to use for the issue created by repolinter-action. This title 
    # should indicate the purpose of the issue, as well as that it was created by
    # a bot.
    #
    # This option will be ignored if output-type != "issue".
    #
    # Default: "[Repolinter] Open Source Policy Issues"
    output-name: ''

    # The name to use for the issue label created by repolinter-action. This name
    # should be unique to repolinter-action (i.e. not used by any other issue) to
    # prevent repolinter-action from getting confused.
    #
    # This option will be ignored if output-type != "issue".
    #
    # Default: "repolinter"
    label-name: ''

    # The color to use for the issue label created by repolinter-action. The value
    # for this option should be an unprefixed RRGGBB hex string (ex. ff568a).
    # The default value is a shade of yellow.
    #
    # This option will be ignored if output-type != "issue".
    #
    # Default: "fbca04"
    label-color: ''

    # Personal access token (PAT) used to create an issue on this repository.
    # This token is optional and only required if this actions is configured to
    # output an issue (see `output-type`). This token must have the `public_repo`
    # scope for the current repository in order to work properly.
    #
    # [Learn more about creating and using encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)
    #
    # Default: ${{ github.token }}
    token: ''

    # The repository name and owner, formatted like so: `owner/repository`.
    # This input determines which repository repolinter-action will create
    # an issue on, if that functionality is enabled.
    #
    # It is recommended that this option is left as the default value.
    # 
    # Default: ${{ github.repository }}
    repository: ''
```

## Outputs

| Key           | Type    | Description                                                                                                   |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `passed`      | boolean | A boolean indicating whether or not the ruleset passed, equivalent to `LintResult#passed`.                    |
| `errored`     | boolean | A boolean indicating whether or or not any errors occurred when running repolinter-action                     |
| `json-output` | string? | The JSON-ified repolinter output from `repolinter.jsonFormatter`. Will only be present if `errored` is false. |

## Usage

### Validate master branch with the default ruleset

The following will run Repolinter with the default ruleset on every push to master, and exit with status 1 if the repository does not pass.

```yaml

name: 'Validate master branch with Repolinter'

on:
  push:
    branches:
      - master

jobs:
  repolinter-action:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v2
      - name: 'Run Repolinter'
        uses: newrelic/repolinter-action@v1

```

### Validate master branch with a remote ruleset

The following will run Repolinter with this [remote ruleset](https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter-newrelic-communityplus.json) on every push to master, and exit with status 1 if the repository does not pass.

```yaml

name: 'Validate master branch with Repolinter'

on:
  push:
    branches:
      - master

jobs:
  repolinter-action:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v2
      - name: 'Run Repolinter'
        uses: newrelic/repolinter-action@v1
        with:
          config-url: https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter-newrelic-communityplus.json

```

### Open an issue on validation fail

The following will run repolinter with this [remote ruleset](https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter-newrelic-communityplus.json) on every push to master, and open a GitHub issue if the repository does not pass.

```yaml
name: 'Validate master branch with Repolinter'

on:
  push:
    branches:
      - master

jobs:
  # Because the output-type is set to 'issue', this job will always succeed.
  repolinter-action:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v2
      - name: 'Run Repolinter'
        uses: newrelic/repolinter-action@v1
        with:
          config-url: https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter-newrelic-communityplus.json
          output-type
          output-type: issue
          # Optionally you can customize the issue and label repolinter-action will create
          output-name: '[Bot] My Issue Title'
          label-name: 'my-repolinter-label'
          label-color: 'ffffff'
```

## Issue Creation Behavior

TODO

## Support

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

>Add the url for the support thread here

## Contributing
We encourage your contributions to improve [project name]! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project.
If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company,  please drop us an email at opensource@newrelic.com.

## License
[Project Name] is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
>[If applicable: The [project name] also uses source code from third-party libraries. You can find full details on which libraries are used and the terms under which they are licensed in the third-party notices document.]
