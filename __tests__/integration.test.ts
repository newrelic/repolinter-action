import * as cp from 'child_process'
import * as path from 'path'
import * as process from 'process'
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

function getBaseEnv(): NodeJS.ProcessEnv {
  const ret: NodeJS.ProcessEnv = {}
  ret[getInputName(Inputs.REPO)] = 'newrelic/repolinter-action'
  ret[getInputName(Inputs.OUTPUT_TYPE)] = 'exit-code'
  ret[getInputName(Inputs.OUTPUT_NAME)] = 'Open Source Policy Issues'
  ret[getInputName(Inputs.LABEL_NAME)] = 'repolinter'
  ret[getInputName(Inputs.LABEL_COLOR)] = 'fbca04'
  ret[getInputName(Inputs.USERNAME)] = 'github-actions'
  ret['GITHUB_ACTION'] = 'true'
  return ret
}

describe('integration', () => {
  beforeEach(() => jest.setTimeout(10000))
  // TODO: fix tests to reflect new exit code logic
  // TODO: add tests for outputs

  test('runs a failing test config', async () => {
    const baseEnv = getBaseEnv()
    baseEnv[getInputName(Inputs.CONFIG_FILE)] = path.resolve(
      __dirname,
      'testconfig.json'
    )

    const {out, code} = await runAction(Object.assign({}, process.env, baseEnv))

    expect(code).not.toEqual(0)
    // TODO: outputs
    expect(out).toContain('testconfig.json')
    expect(out).not.toContain('undefined')
  })

  test('runs a URL config', async () => {
    const baseEnv = getBaseEnv()
    baseEnv[getInputName(Inputs.CONFIG_URL)] =
      'https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter.json'

    const {out, code} = await runAction(Object.assign({}, process.env, baseEnv))

    expect(code).not.toEqual(0)
    expect(out).toContain(
      'https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter.json'
    )
    expect(out).not.toContain('undefined')
  })

  test('runs the default config', async () => {
    const baseEnv = getBaseEnv()
    const {out, code} = await runAction(Object.assign({}, process.env, baseEnv))

    expect(code).not.toEqual(0)
    expect(out).toContain('default')
    expect(out).not.toContain('undefined')
  })

  test('runs a passing config', async () => {
    const baseEnv = getBaseEnv()
    baseEnv[getInputName(Inputs.CONFIG_FILE)] = path.resolve(
      __dirname,
      'passingtestconfig.json'
    )

    const {out, code} = await runAction(Object.assign({}, process.env, baseEnv))

    expect(code).toEqual(0)
    expect(out).toContain('passingtestconfig.json')
    expect(out).not.toContain('undefined')
  })
})
