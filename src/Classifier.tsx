import { useCallback, useRef } from 'react'
import resemble, { ResembleComparisonResult } from 'resemblejs'
import { sortBy, map } from 'lodash'

import { Paper } from '@mui/material'

import { DATA, EMPTY_CELL } from './assets'

interface FixedResembleOut extends ResembleComparisonResult {
  rawMisMatchPercentage: number
}
interface MatchResult {
  id: string
  mismatch: number
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

interface Props {
  screenshot?: string
  setParseResults: React.Dispatch<React.SetStateAction<ParseResult[]>>
}

export const Classifier: React.FC<Props> = ({ screenshot, setParseResults }) => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null)
  const iconCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const onLoad = useCallback(async () => {
    const gridCanvas = gridCanvasRef.current?.getContext('2d')
    const iconCanvas = iconCanvasRef.current?.getContext('2d')
    const image = imgRef.current

    if (!gridCanvas || !iconCanvas || !image) {
      return
    }

    const screenshotHeight = image.height

    const gridPositionX = screenshotHeight * 0.106
    const gridPositionY = screenshotHeight * 0.3

    const gridWidth = screenshotHeight * 0.407
    const gridHeight = gridWidth

    gridCanvas.canvas.width = gridWidth
    gridCanvas.canvas.height = gridHeight

    gridCanvas.drawImage(image, gridPositionX, gridPositionY, gridWidth, gridHeight, 0, 0, gridWidth, gridHeight)

    const iconWidth = gridWidth / 8
    const iconHeight = gridHeight / 8

    iconCanvas.canvas.width = iconWidth
    iconCanvas.canvas.height = iconHeight

    for (let iconX = 0; iconX < 8; iconX++) {
      for (let iconY = 0; iconY < 8; iconY++) {
        iconCanvas.drawImage(
          image,
          gridPositionX + iconY * iconWidth,
          gridPositionY + iconX * iconHeight,
          iconWidth,
          iconHeight,
          0,
          0,
          iconWidth,
          iconHeight
        )

        const source = iconCanvas.canvas.toDataURL()

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
  }, [setParseResults])

  return (
    <>
      <Paper sx={{ p: 2, display: screenshot ? 'block' : 'none' }}>
        <canvas ref={gridCanvasRef} width={0} height={0} />
      </Paper>
      <Paper sx={{ display: 'none' }}>
        <canvas ref={iconCanvasRef} />
        <img ref={imgRef} src={screenshot} alt='' onLoad={onLoad} />
      </Paper>
    </>
  )
}
