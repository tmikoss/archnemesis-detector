import { useEffect, useRef, useState } from 'react'

import resemble, { ResembleComparisonResult } from 'resemblejs'

import { EMPTY_CELL } from './definitions'

import { Preprocessor, ProcessedDefinitionsMap } from './Preprocessor'
import { isEmpty, sortBy, map, countBy, filter, keys, every, includes } from 'lodash'

import styled from 'styled-components'

interface FixedResembleOut extends ResembleComparisonResult {
  rawMisMatchPercentage: number
}

interface MatchResult {
  name: string
  mismatch: number
}

interface ParseResult {
  x: number
  y: number
  empty: boolean
  matchedName?: string
  matchedPct?: number
}

const compareImage = (name: string, left: string, right: string): Promise<MatchResult> => {
  return new Promise<MatchResult>((resolve) => {
    resemble(left)
      .compareTo(right)
      .scaleToSameSize()
      .onComplete((out) => {
        const { rawMisMatchPercentage } = out as FixedResembleOut
        resolve({ name, mismatch: rawMisMatchPercentage })
      })
  })
}

const Layout = styled.div`
  display: grid;
  width: 100%;
  grid-template-areas: 'icons current' 'icons output';
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  gap: 2vmin;
`

const ScreenshotContainer = styled.img`
  display: none;
`

const IconsGrid = styled.div`
  grid-area: icons;
`

const CurrentIcon = styled.div`
  grid-area: current;
  display: flex;
  flex-flow: row;
  justify-content: center;
`

const Output = styled.pre`
  grid-area: output;
`

const App = () => {
  const fullCanvasRef = useRef<HTMLCanvasElement>(null)
  const iconCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [defs, setDefs] = useState<ProcessedDefinitionsMap>({})

  const [output, setOutput] = useState<ParseResult[]>([])

  const loading = isEmpty(defs)

  const onLoad = async () => {
    const fullCanvas = fullCanvasRef.current?.getContext('2d')
    const iconCanvas = iconCanvasRef.current?.getContext('2d')

    const image = imgRef.current

    if (!fullCanvas || !iconCanvas || !image) {
      return
    }

    const sourceW = image.width
    const sourceH = image.height

    const sourceX = sourceW * 0.06
    const sourceY = sourceH * 0.3

    const width = sourceW * 0.2285
    const height = sourceH * 0.407

    fullCanvas.canvas.width = width
    fullCanvas.canvas.height = height

    fullCanvas.drawImage(image, sourceX, sourceY, width, height, 0, 0, width, height)

    const iconWidth = width / 8
    const iconHeight = height / 8

    iconCanvas.canvas.width = iconWidth
    iconCanvas.canvas.height = iconHeight

    for (let iconX = 0; iconX < 8; iconX++) {
      for (let iconY = 0; iconY < 8; iconY++) {
        iconCanvas.drawImage(
          image,
          sourceX + iconY * iconWidth,
          sourceY + iconX * iconHeight,
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
          setOutput((was) => [...was, { x: iconX, y: iconY, empty: true }])
        } else {
          const results = await Promise.all(map(defs, ({ iconUri }, name) => compareImage(name, source, iconUri)))

          const [{ mismatch, name }] = sortBy(results, 'mismatch')

          setOutput((was) => [
            ...was,
            { x: iconX, y: iconY, empty: false, matchedName: name, matchedPct: 100 - mismatch }
          ])
        }
      }
    }
  }

  const foundItems = countBy(
    filter(output, ({ empty }) => !empty),
    'matchedName'
  )

  const distinctFoundItems = keys(foundItems)

  const foundRecipes = filter(
    defs,
    ({ recipe }) => recipe.length > 0 && every(recipe, (requirement) => includes(distinctFoundItems, requirement))
  )

  useEffect(() => {
    const event = (evt: unknown) => {
      const {
        clipboardData: { files }
      } = evt as React.ClipboardEvent

      const firstFile = files ? files[0] : null

      if (firstFile) {
        const reader = new FileReader()
        reader.onload = () => {
          if (imgRef.current && reader.result) {
            imgRef.current.src = reader.result as string
          }
        }
        reader.readAsDataURL(firstFile)
      }
    }

    document.querySelector('body')?.addEventListener('paste', event)
  }, [])

  return (
    <>
      <Layout>
        <CurrentIcon>
          <canvas ref={iconCanvasRef} width={0} height={0} />
        </CurrentIcon>

        <IconsGrid>
          <canvas ref={fullCanvasRef} width={0} height={0} />
        </IconsGrid>

        <Output>
          {JSON.stringify(foundItems, null, 2)}
          {JSON.stringify(
            map(foundRecipes, ({ name, recipe }) => `${name} = ${recipe.join(' + ')}`),
            null,
            2
          )}
        </Output>
      </Layout>
      <Preprocessor setDefs={setDefs} />
      {!loading && <ScreenshotContainer ref={imgRef} src='' alt='' onLoad={onLoad} />}
    </>
  )
}

export default App
