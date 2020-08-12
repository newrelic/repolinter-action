import * as cp from 'child_process'
import * as path from 'path'
import {Inputs} from '../src/inputs'

async function execAsync(
  command: string,
  opts: cp.ExecOptions
): Promise<{out: string; err: string; code: number}> {
  return new Promise((resolve, reject) => {
    cp.exec(command, opts, (err, outstd, errstd) =>
      err !== null && err.code === undefined
        ? reject(err)
        : resolve({
            out: outstd,
            err: errstd,
            code: err !== null ? (err.code as number) : 0
          })
    )
  })
}

async function runAction(
  env: NodeJS.ProcessEnv
): Promise<{out: string; err: string; code: number}> {
  const ip = path.join(__dirname, '..', 'dist', 'index.js')
  return execAsync(`node ${ip}`, {env})
}

function getInputName(input: string): string {
  return `INPUT_${input.replace(/ /g, '_').toUpperCase()}`
}

describe('integration', () => {
  beforeEach(() => {
    process.env[getInputName(Inputs.REPO)] = 'newrelic/repolinter-action'
    process.env[getInputName(Inputs.OUTPUT_TYPE)] = 'exit-code'
    process.env[getInputName(Inputs.OUTPUT_NAME)] = 'Open Source Policy Issues'
    process.env[getInputName(Inputs.LABEL_NAME)] = 'repolinter'
    process.env[getInputName(Inputs.LABEL_COLOR)] = 'fbca04'
    process.env['GITHUB_ACTION'] = 'true'
    delete process.env[getInputName(Inputs.CONFIG_FILE)]
    delete process.env[getInputName(Inputs.CONFIG_URL)]
    delete process.env['GITHUB_TOKEN']
    delete process.env['INPUT_GITHUB_TOKEN']
    delete process.env[getInputName(Inputs.TOKEN)]
  })

  // TODO: fix tests to reflect new exit code logic
  // TODO: add tests for outputs

  test('runs a failing test config', async () => {
    process.env[getInputName(Inputs.CONFIG_FILE)] = path.resolve(
      __dirname,
      'testconfig.json'
    )

    const {out, code} = await runAction(process.env)

    // console.debug(out)
    expect(code).not.toEqual(0)
    // TODO: outputs
    expect(out).toContain('testconfig.json')
    expect(out).not.toContain('undefined')
  })

  test('runs a URL config', async () => {
    process.env[getInputName(Inputs.CONFIG_URL)] =
      'https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter.json'

    const {out, code} = await runAction(process.env)

    // console.debug(out)
    expect(code).not.toEqual(0)
    expect(out).toContain(
      'https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter.json'
    )
    expect(out).not.toContain('undefined')
  })

  test('runs the default config', async () => {
    const {out, code} = await runAction(process.env)

    // console.debug(out)
    expect(code).not.toEqual(0)
    expect(out).toContain('default')
    expect(out).not.toContain('undefined')
  })

  test('runs a passing config', async () => {
    process.env[getInputName(Inputs.CONFIG_FILE)] = path.resolve(
      __dirname,
      'passingtestconfig.json'
    )

    const {out, code} = await runAction(process.env)

    // console.debug(out)
    expect(code).toEqual(0)
    expect(out).toContain('passingtestconfig.json')
    expect(out).not.toContain('undefined')
  })
})
