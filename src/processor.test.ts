import { processImage } from './processor'
import nodeCanvas from 'canvas'
import _ from 'lodash'

const TIMEOUT = 30_000

type KnownContents = [y: number, x: number, id?: string][]

const loadImage = async (source: string) => nodeCanvas.loadImage(source) as unknown as HTMLImageElement
const buildCanvas = () => nodeCanvas.createCanvas(2000, 2000) as unknown as HTMLCanvasElement

describe('reported misclassifications', () => {
  const expectationsMap: Record<string, KnownContents> = {
    'testSamples/basic.png': [
      [0, 0, 'juggernaut'],
      [0, 1, 'flame-strider'],
      [1, 1, undefined],
      [0, 4, 'toxic'],
      [4, 0, 'steel-infused'],
      [5, 0, 'overcharged'],
      [7, 0, 'flameweaver'],
      [2, 0, 'arcane-buffer'],
      [2, 1, 'arcane-buffer'],
      [1, 0, 'stormweaver'],
      [0, 7, 'malediction'],
      [7, 7, 'stormweaver'],
    ],
    'testSamples/issue-16.png': [
      [0, 4, 'rejuvenating'],
      [0, 5, 'arcane-buffer'],
      [1, 0, 'mana-siphoner'],
      [2, 5, 'evocationist'],
      [2, 7, 'flameweaver'],
      [3, 1, 'echoist'],
    ],
    'testSamples/issue-17.jpeg': [
      [4, 6, 'stormweaver']
    ],
    'testSamples/issue-15.png': [
      [0, 6, 'incendiary'],
      [1, 6, 'stormweaver'],
      [2, 4, 'stormweaver'],
      [3, 4, 'berserker'],
      [4, 7, 'stormweaver'],
      [7, 7, 'arcane-buffer'],
    ],
    'testSamples/issue-8.png': [
      [1, 2, 'corrupter'],
      [2, 7, 'arcane-buffer'],
      [4, 4, 'juggernaut'],
      [5, 7, 'evocationist'],
      [6, 5, 'berserker'],
    ],
    'testSamples/issue-6.jpeg': [
      [0, 1, 'toxic']
    ],
  }

  _.each(expectationsMap, (knownContents, filename) => {
    describe(filename, () => {
      let result: ParseResult[] = []

      beforeAll(async () => {
        const setState = jest.fn(callback => {
          result = callback(result)
        })

        const image = await loadImage(filename)

        await processImage(image, buildCanvas(), setState, buildCanvas())
      }, TIMEOUT)

      it('should provide result for every square', () => {
        expect(result.length).toBe(64)
      })

      _.each(knownContents, ([y, x, expected]) => {
        it(`should detect ${expected} at x ${x}, y ${y}`, () => {
          const item = _.find(result, { x, y })

          const foundId = item?.id

          if (foundId !== expected) {
            // console.log(item)
          }

          expect(foundId).toBe(expected)
        })
      })
    })
  })
})
