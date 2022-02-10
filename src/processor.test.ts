import { processImage } from './processor'
import nodeCanvas from 'canvas'
import _ from 'lodash'

const TIMEOUT = 30_000

type KnownContents = [row: number, column: number, id?: string][]

const loadImage = async (source: string) => nodeCanvas.loadImage(source) as unknown as HTMLImageElement
const buildCanvas = () => nodeCanvas.createCanvas(2000, 2000) as unknown as HTMLCanvasElement

describe('basic.png', () => {
  let result: ParseResult[] = []

  beforeAll(async () => {
    const setState = jest.fn(callback => {
      result = callback(result)
    })

    const image = await loadImage('testSamples/basic.png')

    await processImage(image, buildCanvas(), setState, buildCanvas())
  }, TIMEOUT)

  it('should provide result for every square', () => {
    expect(result.length).toBe(64)
  })

  it('should detect and label empty squares', () => {
    expect(_.find(result, { x: 1, y: 1 })?.empty).toBe(true)
  })

  const knownContents: KnownContents = [
    [1, 1, 'juggernaut'],
    [1, 2, 'flame-strider'],
    [2, 2, undefined],
    [1, 5, 'toxic'],
    [5, 1, 'steel-infused'],
    [6, 1, 'overcharged'],
    [8, 1, 'flameweaver'],
    [3, 1, 'arcane-buffer'],
    [3, 2, 'arcane-buffer'],
    [2, 1, 'stormweaver'],
    [1, 8, 'malediction'],
    [8, 8, 'stormweaver'],
  ]

  _.each(knownContents, ([row, column, expected]) => {
    it(`should detect ${expected} at row ${row}, column ${column}`, () => {
      const item = _.find(result, { x: column - 1, y: row - 1 })

      const foundId = item?.id

      if (foundId !== expected) {
        console.log(item)
      }

      expect(foundId).toBe(expected)
    })
  })
})
