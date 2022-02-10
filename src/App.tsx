import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { map, countBy, filter, keys, every, includes, find } from 'lodash'
import {
  Avatar,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
  Container,
  Tooltip,
  Link,
  Box
} from '@mui/material'

import { DATA } from './assets'
import { dataItem } from './utils'
import { processImage } from './processor'
import { Results } from './Results'

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
  const imgRef = useRef<HTMLImageElement>(null)

  const [parseResults, setParseResults] = useState<ParseResult[]>([])
  const [screenshot, setScreenshot] = useState<string>()

  const onLoad = useCallback(async () => {
    const previewCanvas = gridCanvasRef.current
    const image = imgRef.current

    if (!previewCanvas || !image) {
      return
    }

    processImage(image, previewCanvas, setParseResults)
  }, [setParseResults])

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
          if (reader.result) {
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
            <Typography variant={screenshot ? 'caption' : 'h5'} align='center' sx={{ my: 4 }}>
              Take a full-size screenshot of the game with archnemesis inventory open, then Ctrl-V in this page.
            </Typography>
            {!screenshot && (
              <Grid container justifyContent='center'>
                <Link component='button' onClick={() => setScreenshot(`${process.env.PUBLIC_URL}/sampleImage.png`)}>
                  Or click here to load a sample image.
                </Link>
              </Grid>
            )}
          </Paper>
        </Grid>

        {screenshot && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant='caption'>
                This is very much a work in progress, it's bound to make mistakes, a lot of them. When it makes a
                mistake, click on the wrong cell in right-side grid and follow the instructions there.
              </Typography>
            </Paper>
          </Grid>
        )}
        <Grid item xs={12} md='auto'>
          <Paper sx={{ p: 2, display: screenshot ? 'block' : 'none' }}>
            <canvas ref={gridCanvasRef} width={0} height={0} />

            <Typography variant='caption' component='div'>
              Above image should contain exactly the archnemesis inventory from your screenshot
            </Typography>
          </Paper>
        </Grid>
        {screenshot && (
          <>
            <Grid item xs={12} md>
              <Results parseResults={parseResults} />
            </Grid>

            <Grid item xs={12}>
              <FoundRecipes foundItems={foundItems} />
            </Grid>
          </>
        )}
      </Grid>

      <Box sx={{ display: 'none' }}>
        <img ref={imgRef} src={screenshot} alt='' onLoad={onLoad} />
      </Box>
    </Container>
  )
}

export default App
