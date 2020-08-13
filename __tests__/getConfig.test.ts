import getConfig from '../src/getConfig'
import * as path from 'path'
import * as fs from 'fs'
import nock from 'nock'

describe('getConfig', () => {
  test('getConfig returns a config from a JSON file', async () => {
    const filepath = path.resolve(__dirname, 'testconfig.json')
    const expected = JSON.parse(await fs.promises.readFile(filepath, 'utf8'))
    const res = await getConfig({configFile: filepath})

    expect(res).toMatchObject(expected)
  })

  test('getConfig returns a config from a URL', async () => {
    // TODO: change this to point to the new relic repo when it goes public
    const url =
      'https://raw.githubusercontent.com/aperture-science-incorporated/.github/master/repolinter.json'
    const filepath = path.resolve(__dirname, 'testconfig.json')
    const expected = JSON.parse(await fs.promises.readFile(filepath, 'utf8'))
    const scope = nock('https://raw.githubusercontent.com')
      .get('/aperture-science-incorporated/.github/master/repolinter.json')
      .replyWithFile(200, filepath)

    const res = await getConfig({configUrl: url})

    expect(res).toMatchObject(expected)

    scope.done()
  })

  test('getConfig fails with an invalid file', async () => {
    const filepath = 'notafile'

    expect(async () => getConfig({configFile: filepath})).rejects.toThrowError()
  })

  test('getConfig failed with an invalid url', async () => {
    const url = 'notadomain'

    expect(async () => getConfig({configUrl: url})).rejects.toThrowError()
  })

  test('getConfig fails with an invalid json structure', async () => {
    const filepath = path.resolve(__dirname, 'invalidtestconfig.json')

    expect(async () => getConfig({configFile: filepath})).rejects.toThrowError()
  })
})
