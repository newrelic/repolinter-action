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
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  return execAsync(`node ${ip}`, {env})
}

function getInputName(input: string): string {
  return `INPUT_${input.replace(/ /g, '_').toUpperCase()}`
}

describe('main', () => {
  beforeEach(() => {
    process.env[getInputName(Inputs.REPO)] = 'newrelic/repolinter-action'
    process.env[getInputName(Inputs.OUTPUT_TYPE)] = 'off'
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

  test('throws when no token is supplied and output-type is not off', async () => {
    process.env[getInputName(Inputs.OUTPUT_TYPE)] = 'issue'
    const {code} = await runAction(process.env)

    // console.debug(out)
    expect(code).not.toEqual(0)
  })

  test('throws when an invalid token is supplied and output-type is not off', async () => {
    process.env['GITHUB_TOKEN'] = '2'
    process.env[getInputName(Inputs.OUTPUT_TYPE)] = 'issue'

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain('Bad credentials')
    // console.debug(out)
  })

  test('throws when an invalid is supplied in TOKEN and output-type is not off', async () => {
    process.env[getInputName(Inputs.TOKEN)] = '2'
    process.env[getInputName(Inputs.OUTPUT_TYPE)] = 'issue'

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain('Bad credentials')
    // console.debug(out)
  })

  test('throws when no output-type is supplied', async () => {
    delete process.env[getInputName(Inputs.OUTPUT_TYPE)]

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain(
      `::error::Input required and not supplied: ${Inputs.OUTPUT_TYPE}`
    )
  })

  test('throws when an invalid output-type is supplied', async () => {
    process.env[getInputName(Inputs.OUTPUT_TYPE)] = 'string-cheese'

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain('string-cheese')
  })

  test('throws when no output-name is supplied', async () => {
    delete process.env[getInputName(Inputs.OUTPUT_NAME)]

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain(
      `::error::Input required and not supplied: ${Inputs.OUTPUT_NAME}`
    )
  })

  test('throws when no repository is supplied', async () => {
    delete process.env[getInputName(Inputs.REPO)]

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain(
      `::error::Input required and not supplied: ${Inputs.REPO}`
    )
    // console.debug(out)
  })

  test('throws when an invalid config-url is specified', async () => {
    process.env[getInputName(Inputs.CONFIG_URL)] = 'notadomain'

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain('notadomain')
    // console.debug(out)
  })

  test('throws when no label name is specified', async () => {
    delete process.env[getInputName(Inputs.LABEL_NAME)]

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain(
      `::error::Input required and not supplied: ${Inputs.LABEL_NAME}`
    )
    // console.debug(out)
  })

  test('throws when an invalid label name is specified', async () => {
    process.env[getInputName(Inputs.LABEL_NAME)] = ''

    const {code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    // console.debug(out)
  })

  test('throws when no label color is specified', async () => {
    delete process.env[getInputName(Inputs.LABEL_COLOR)]

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain(
      `::error::Input required and not supplied: ${Inputs.LABEL_COLOR}`
    )
    // console.debug(out)
  })

  test('throws when an invalid label color is specified', async () => {
    process.env[getInputName(Inputs.LABEL_COLOR)] = 'notacolor'

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain('notacolor')
    // console.debug(out)
  })

  test('throws when no repository is supplied', async () => {
    delete process.env[getInputName(Inputs.REPO)]

    const {out, code} = await runAction(process.env)

    expect(code).not.toEqual(0)
    expect(out).toContain(
      `::error::Input required and not supplied: ${Inputs.REPO}`
    )
    // console.debug(out)
  })

  test('runs a test config', async () => {
    process.env[getInputName(Inputs.CONFIG_FILE)] = path.resolve(
      __dirname,
      'testconfig.json'
    )

    const {out, code} = await runAction(process.env)

    // console.debug(out)
    expect(code).toEqual(0)
    expect(out).toContain('testconfig.json')
    expect(out).not.toContain('undefined')
  })

  test('runs a URL config', async () => {
    process.env[getInputName(Inputs.CONFIG_URL)] =
      'https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter.json'

    const {out, code} = await runAction(process.env)

    // console.debug(out)
    expect(code).toEqual(0)
    expect(out).toContain(
      'https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter.json'
    )
    expect(out).not.toContain('undefined')
  })

  test('runs the default config', async () => {
    const {out, code} = await runAction(process.env)

    // console.debug(out)
    expect(code).toEqual(0)
    expect(out).toContain('default')
    expect(out).not.toContain('undefined')
  })
})
