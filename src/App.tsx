import { useRef, useState } from 'react'

import resemble, { ResembleComparisonResult } from 'resemblejs'

import { definitions } from './definitions'

import screenshotSrc from './images/screenshot.png'

interface FixedResembleOut extends ResembleComparisonResult {
  rawMisMatchPercentage: number
}

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function App() {
  const fullCanvasRef = useRef<HTMLCanvasElement>(null)
  const iconCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const scratchpadRef = useRef<HTMLCanvasElement>(null)
  const matchRef = useRef<HTMLImageElement>(null)

  const [output, setOutput] = useState('')

  const onLoad = async () => {
    await timeout(500)

    const fullCanvas = fullCanvasRef.current?.getContext('2d')
    const iconCanvas = iconCanvasRef.current?.getContext('2d')
    const scratchpad = scratchpadRef.current?.getContext('2d')
    const image = imgRef.current

    if (!fullCanvas || !iconCanvas || !image || !scratchpad) {
      return
    }

    const sourceW = 2560
    const sourceH = 1440

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

    const iconHeightWithoutTextRatio = 0.75

    for (let iconX = 0; iconX < 8; iconX++) {
      for (let iconY = 0; iconY < 8; iconY++) {
        iconCanvas.drawImage(
          image,
          sourceX + iconY * iconWidth,
          sourceY + iconX * iconHeight,
          iconWidth,
          iconHeight * iconHeightWithoutTextRatio,
          0,
          0,
          iconWidth,
          iconHeight * iconHeightWithoutTextRatio
        )

        let minMismatch = 100
        let bestMatchName = ''
        let bestIcon = null

        const source = iconCanvas.canvas.toDataURL()

        for (const name in definitions) {
          const { iconUri } = definitions[name]

          const img = new Image()
          await new Promise((resolve) => {
            img.onload = resolve
            img.src = iconUri
          })

          scratchpad.rect(0, 0, scratchpad.canvas.width, scratchpad.canvas.height)
          scratchpad.fillStyle = '#07071f'
          scratchpad.fill()
          scratchpad.drawImage(
            img,
            0,
            0,
            iconWidth,
            iconHeight * iconHeightWithoutTextRatio,
            0,
            0,
            iconWidth,
            iconHeight * iconHeightWithoutTextRatio
          )

          const candidate = scratchpad.canvas.toDataURL()

          const output = await new Promise<FixedResembleOut>((resolve) => {
            resemble(source)
              .compareTo(candidate)
              .scaleToSameSize()
              .onComplete((out) => resolve(out as FixedResembleOut))
          })

          bestMatchName += `${100 - output.rawMisMatchPercentage} match as ${name}\n`

          if (output.rawMisMatchPercentage < minMismatch) {
            minMismatch = output.rawMisMatchPercentage
            bestIcon = candidate
          }
        }

        if (minMismatch < 80) {
          setOutput(bestMatchName)
          if (matchRef.current && bestIcon) {
            matchRef.current.src = bestIcon
          }
          // await timeout(2000)
        }
      }
    }
  }

  return (
    <div>
      <div>
        <canvas ref={iconCanvasRef} height={48} width={75} />
        <img ref={matchRef} src='' alt='' />
        <canvas ref={scratchpadRef} width={48} height={48} />
      </div>

      <pre>{output}</pre>

      <div>
        <canvas ref={fullCanvasRef} />
      </div>

      <img ref={imgRef} src={screenshotSrc} alt='' onLoad={onLoad} style={{ display: 'none' }} />
    </div>
  )
}

export default App
