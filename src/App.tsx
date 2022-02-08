import { useRef } from 'react'

import iconSrc from './images/good.png'
import badIconSrc from './images/bad.png'
import screenshotSrc from './images/screenshot.png'

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function App() {
  const fullCanvasRef = useRef<HTMLCanvasElement>(null)
  const iconCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const onLoad = async () => {
    const fullCanvas = fullCanvasRef.current?.getContext('2d')
    const iconCanvas = iconCanvasRef.current?.getContext('2d')
    const image = imgRef.current

    if (!fullCanvas || !iconCanvas || !image) {
      return
    }

    const sourceW = 2560
    const sourceH = 1440

    const sourceX = sourceW * 0.06
    const sourceY = sourceH * 0.3

    const width = Math.ceil(sourceW * 0.2285)
    const height = Math.ceil(sourceH * 0.407)

    fullCanvas.canvas.width = width
    fullCanvas.canvas.height = height

    fullCanvas.drawImage(image, sourceX, sourceY, width, height, 0, 0, width, height)

    const iconWidth = width / 8
    const iconHeight = height / 8

    const iconHeightWithoutTextRatio = 0.75

    console.log({ width, height, iconWidth, iconHeight })

    for (let iconX = 0; iconX < 8; iconX++) {
      for (let iconY = 0; iconY < 8; iconY++) {
        iconCanvas.drawImage(
          image,
          sourceX + iconX * iconWidth,
          sourceY + iconY * iconHeight,
          iconWidth,
          iconHeight * iconHeightWithoutTextRatio,
          0,
          0,
          iconWidth,
          iconHeight * iconHeightWithoutTextRatio
        )

        await timeout(500)
      }
    }
  }

  return (
    <div>
      <div>
        <canvas ref={iconCanvasRef} />
      </div>

      <div>
        <canvas ref={fullCanvasRef} />
      </div>

      <img ref={imgRef} src={screenshotSrc} alt='' onLoad={onLoad} style={{ display: 'none' }} />
    </div>
  )
}

export default App
