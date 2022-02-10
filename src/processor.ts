import resemble, { ResembleComparisonResult } from 'resemblejs'
import { sortBy, map } from 'lodash'

import { DATA, EMPTY_CELL } from './assets'

const ICONS_PER_ROW = 8

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
        resolve({ id, mismatch: rawMisMatchPercentage })
      })
  })
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

  for (let iconX = 0; iconX < ICONS_PER_ROW; iconX++) {
    for (let iconY = 0; iconY < ICONS_PER_ROW; iconY++) {
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

      const { mismatch } = await compareImage('empty', source, EMPTY_CELL)

      if (mismatch < 15) {
        setParseResults((was) => [...was, { x: iconX, y: iconY, empty: true }])
      } else {
        const results = await Promise.all(map(DATA, ({ icon, id }) => compareImage(id, source, icon)))

        const [{ mismatch, id }] = sortBy(results, 'mismatch')

        setParseResults((was) => [...was, { x: iconX, y: iconY, empty: false, id, matchedPct: 100 - mismatch }])
      }
    }
  }
}
