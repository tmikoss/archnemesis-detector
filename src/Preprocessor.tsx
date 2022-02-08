import React, { useLayoutEffect, useRef } from 'react'
import { definitions, DefinitionsMap } from './definitions'
import styled from 'styled-components'

export const ICON_SIZE = 48

const Scratchpad = styled.canvas`
  display: none;
`

export const Preprocessor: React.FC<{ setDefs: React.Dispatch<React.SetStateAction<DefinitionsMap>> }> = ({
  setDefs
}) => {
  const scratchpadRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const exec = async () => {
      const defmap: DefinitionsMap = {}

      const scratchpad = scratchpadRef.current?.getContext('2d')

      if (!scratchpad) {
        return
      }

      for (const name in definitions) {
        const { recipe } = definitions[name]

        const img = new Image()
        await new Promise((resolve) => {
          img.onload = resolve
          img.src = `/icons/${name}.png`
        })

        scratchpad.rect(0, 0, ICON_SIZE, ICON_SIZE)
        scratchpad.fillStyle = '#07071f'
        scratchpad.fill()
        scratchpad.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE, 0, 0, ICON_SIZE, ICON_SIZE)

        const transformed = scratchpad.canvas.toDataURL()

        defmap[name] = { recipe, iconUri: transformed }
      }

      setDefs(defmap)
    }

    exec()
  }, [setDefs])

  return <Scratchpad ref={scratchpadRef} width={ICON_SIZE} height={ICON_SIZE} />
}
