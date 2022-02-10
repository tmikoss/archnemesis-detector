import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import resemble, { ResembleComparisonResult } from 'resemblejs'
import { sortBy, map, countBy, filter, keys, every, includes, find } from 'lodash'

import {
  Avatar,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Badge,
  Typography,
  Container,
  Tooltip,
  Link
} from '@mui/material'

// import sample from './images/screenshot.png'

import { DATA, EMPTY_CELL, DataItem } from './assets'
interface FixedResembleOut extends ResembleComparisonResult {
  rawMisMatchPercentage: number
}
interface MatchResult {
  id: string
  mismatch: number
}

interface ParseResult {
  x: number
  y: number
  empty: boolean
  id?: string
  matchedPct?: number
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

const dataItem = (id: string) => find(DATA, { id }) as DataItem

const FoundItems: React.FC<{ foundItems: Record<string, number> }> = ({ foundItems }) => {
  const listItems = map(foundItems, (count, id) => {
    const { name, icon } = dataItem(id)

    return (
      <ListItem key={id}>
        <ListItemAvatar>
          <Badge badgeContent={count > 1 ? count : null} color='primary'>
            <Avatar src={icon} />
          </Badge>
        </ListItemAvatar>
        <ListItemText primary={name} />
      </ListItem>
    )
  })

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant='h5'>Detected</Typography>
      <List dense>{listItems}</List>
    </Paper>
  )
}

const FoundRecipes: React.FC<{ foundItems: Record<string, number> }> = ({ foundItems }) => {
  const foundRecipes = useMemo(() => {
    const distinctFoundItems = keys(foundItems)

    return filter(
      DATA,
      ({ recipe }) => recipe.length > 0 && every(recipe, (requirement) => includes(distinctFoundItems, requirement))
    )
  }, [foundItems])

  if (foundRecipes.length < 1) {
    return null
  }

  const listItems = map(foundRecipes, ({ id, name, icon, recipe }) => {
    const recipeText = map(recipe, (id) => dataItem(id).name).join(' + ')

    return (
      <ListItem key={id}>
        <ListItemAvatar>
          <Avatar src={icon} />
        </ListItemAvatar>
        <ListItemText primary={name} secondary={recipeText} />
      </ListItem>
    )
  })

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant='h5'>Possible recipes</Typography>
      <List dense>{listItems}</List>
    </Paper>
  )
}

const App = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null)
  const iconCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [parseResults, setParseResults] = useState<ParseResult[]>([])
  const [screenshot, setScreenshot] = useState<string>()

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
  }, [])

  useEffect(() => {
    const event = (evt: unknown) => {
      const {
        clipboardData: { files }
      } = evt as React.ClipboardEvent

      const firstFile = files ? files[0] : null

      if (firstFile) {
        setParseResults([])

        const reader = new FileReader()
        reader.onload = () => {
          if (imgRef.current && reader.result) {
            setScreenshot(reader.result as string)
          }
        }
        reader.readAsDataURL(firstFile)
      }
    }

    document.querySelector('body')?.addEventListener('paste', event)
  }, [])

  const foundItems = useMemo(
    () =>
      countBy(
        filter(parseResults, ({ empty }) => !empty),
        'id'
      ),
    [parseResults]
  )

  const progress = Math.min(Math.ceil((parseResults.length * 100) / 64), 100)

  return (
    <Container maxWidth='xl'>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant={screenshot ? 'caption' : 'subtitle1'} align='center'>
              Use the power of
              <Tooltip title="Just like nearly every AI project, it's just some math the developer does not 100% understand.">
                <span> AI™ ComputerVision™ </span>
              </Tooltip>
              and data appropriated from{' '}
              <Link href='https://poedb.tw/us/Archnemesis_league' target='_blank'>
                PoEDB
              </Link>{' '}
              to find out what Archnemesis recipes you can make.
            </Typography>
            <Typography variant={screenshot ? 'caption' : 'h5'} align='center'>
              Take a screenshot of the game with archnemesis inventory open, then Ctrl-V in this page.
            </Typography>
          </Paper>
        </Grid>

        {screenshot && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <LinearProgress variant='determinate' value={progress} />
            </Paper>

            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant='caption'>
                This is very much a work in progress, it's bound to make mistakes, a lot of them. When it makes a
                mistake, share the screenshot, describe which cell has the error, what the tool found, and what it
                should have been.
              </Typography>
            </Paper>
          </Grid>
        )}
        <Grid item xs='auto'>
          <Paper sx={{ p: 2, display: screenshot ? 'block' : 'none' }}>
            <canvas ref={gridCanvasRef} width={0} height={0} />
          </Paper>
        </Grid>
        {screenshot && (
          <Grid item xs='auto'>
            <FoundItems foundItems={foundItems} />
          </Grid>
        )}
        <Grid item xs>
          <FoundRecipes foundItems={foundItems} />
        </Grid>
      </Grid>

      <Paper sx={{ display: 'none' }}>
        <img ref={imgRef} src={screenshot} alt='' onLoad={onLoad} />
        <canvas ref={iconCanvasRef} />
      </Paper>
    </Container>
  )
}

export default App
