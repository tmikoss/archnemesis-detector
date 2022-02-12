import { useCallback, useEffect, useRef, useState } from 'react'
import { Grid, Paper, Typography, Container, Tooltip, Link, Box, LinearProgress } from '@mui/material'

import { processImage } from './processor'
import { DetectedGrid, Preview, DetectedRecipes } from './Results'

const App = () => {
  const imgRef = useRef<HTMLImageElement>(null)

  const [parseResults, setParseResults] = useState<ParseResult[]>([])
  const [screenshot, setScreenshot] = useState<string>()
  const [gridPreview, setGridPreview] = useState<string>()

  const onLoad = useCallback(async () => {
    const image = imgRef.current

    if (image) {
      processImage(image, setParseResults, setGridPreview)
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
          if (reader.result) {
            setScreenshot(reader.result as string)
          }
        }
        reader.readAsDataURL(firstFile)
      }
    }

    document.querySelector('body')?.addEventListener('paste', event)
  }, [])

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
            <Typography variant={screenshot ? 'caption' : 'h5'} align='center' sx={{ my: 4 }}>
              Take a full-size screenshot of the game with archnemesis inventory open, then Ctrl-V in this page.
            </Typography>
            {false && (
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
        <Grid item xs={12}>
          {progress < 100 ? <LinearProgress variant='determinate' value={progress} sx={{ mt: 2 }} /> : null}
        </Grid>
        {screenshot && (
          <>
            <Grid item xs={12} md='auto'>
              <Preview preview={gridPreview} />
            </Grid>
            <Grid item xs={12} md='auto'>
              <DetectedGrid parseResults={parseResults} />
            </Grid>
            <Grid item lg={12} xl>
              <DetectedRecipes parseResults={parseResults} />
            </Grid>
          </>
        )}
      </Grid>

      <Box sx={{ display: 'none' }}>
        <img ref={imgRef} src={screenshot} alt='' onLoad={onLoad} key={screenshot} />
      </Box>
    </Container>
  )
}

export default App
