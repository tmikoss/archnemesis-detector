import resemble, { ResembleComparisonResult } from 'resemblejs'
import { sortBy, map, isEqual, find, take } from 'lodash'

import { DATA, EMPTY_CELL } from './assets'
import { ICONS_PER_ROW } from './utils'

interface FixedResembleOut extends ResembleComparisonResult {
  rawMisMatchPercentage: number
}

const compareImage = (id: string, left: string, right: string): Promise<MatchResult> => {
  return new Promise<MatchResult>((resolve) => {
    resemble(left)
      .compareTo(right)
      .scaleToSameSize()
      .onComplete((out) => {
        const { rawMisMatchPercentage } = out as FixedResembleOut
        resolve({ id, match: 100 - rawMisMatchPercentage })
      })
  })
}

type Override = {
  matches: string[],
  forcedResult: string
}

const OVERRIDES: Override[] = [
  {
    matches: ['berserker', 'toxic', 'echoist', 'arcane-buffer'],
    forcedResult: 'toxic'
  },
  {
    matches: ['echoist', 'arcane-buffer', 'berserker', 'incendiary'],
    forcedResult: 'arcane-buffer'
  },
  {
    matches: ['echoist', 'stormweaver', 'frostweaver', 'soul-conduit'],
    forcedResult: 'stormweaver'
  }
]

const pickBest = (sortedResults: MatchResult[]): MatchResult => {
  const sortedIds = map(sortedResults, 'id')

  for (const { matches, forcedResult } of OVERRIDES) {
    if (isEqual(matches, take(sortedIds, matches.length))) {
      return find(sortedResults, { id: forcedResult }) as MatchResult
    }
  }

  return sortedResults[0]
}

export const processImage = async (
  image: HTMLImageElement,
  preview: HTMLCanvasElement,
  setParseResults: React.Dispatch<React.SetStateAction<ParseResult[]>>,
  scratchpad: HTMLCanvasElement = document.createElement('canvas')
) => {
  const previewCanvas = preview.getContext('2d')
  const scratchpadCanvas = scratchpad.getContext('2d')

  if (!previewCanvas || !scratchpadCanvas) {
    return
  }

  const imageHeight = image.height

  const gridPositionX = imageHeight * 0.106
  const gridPositionY = imageHeight * 0.3

  const gridWidth = imageHeight * 0.407
  const gridHeight = gridWidth

  previewCanvas.canvas.width = gridWidth
  previewCanvas.canvas.height = gridHeight

  previewCanvas.drawImage(image, gridPositionX, gridPositionY, gridWidth, gridHeight, 0, 0, gridWidth, gridHeight)

  const iconWidth = gridWidth / 8
  const iconHeight = gridHeight / 8

  scratchpadCanvas.canvas.width = iconWidth
  scratchpadCanvas.canvas.height = iconHeight

  for (let iconY = 0; iconY < ICONS_PER_ROW; iconY++) {
    for (let iconX = 0; iconX < ICONS_PER_ROW; iconX++) {
      scratchpadCanvas.drawImage(
        image,
        gridPositionX + iconX * iconWidth,
        gridPositionY + iconY * iconHeight,
        iconWidth,
        iconHeight,
        0,
        0,
        iconWidth,
        iconHeight
      )

      const source = scratchpadCanvas.canvas.toDataURL()

      const { match } = await compareImage('empty', source, EMPTY_CELL)

      if (match > 85) {
        setParseResults((was) => [...was, { x: iconX, y: iconY, empty: true }])
      } else {
        const results = await Promise.all(map(DATA, ({ icon, id }) => compareImage(id, source, icon)))

        const sortedResults = sortBy(results, ({ match }) => -match)

        const { match, id } = pickBest(sortedResults)

        setParseResults((was) => [...was, { x: iconX, y: iconY, empty: false, id, matchedPct: match, topMatches: take(sortedResults, 10) }])
      }
    }
  }
}
