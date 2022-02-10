import styled from 'styled-components'
import { useCallback, useMemo, useState } from 'react'
import { map, countBy, filter, sortBy } from 'lodash'
import {
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Badge,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  Typography,
  DialogContent,
  Link
} from '@mui/material'
import { dataItem } from './utils'

const NBSP = ' '
const ICON_WIDTH = 48

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, ${ICON_WIDTH}px);
  grid-template-rows: repeat(auto-fill, ${ICON_WIDTH}px);
  gap: ${ICON_WIDTH / 8}px;
`

const GridCell = styled.div<{ $x: number; $y: number }>`
  grid-column: ${({ $x }) => $x + 1};
  grid-row: ${({ $y }) => $y + 1};
  height: ${ICON_WIDTH}px;
  width: ${ICON_WIDTH}px;
  cursor: pointer;
`

const JsonContainer = styled.div`
  max-height: 50vh;
  overflow: scroll;
  padding: 2em;
  font-size: 0.75em;
`

interface Props {
  parseResults: ParseResult[]
}

const ResultsGridCell: React.FC<{ result: ParseResult }> = ({ result }) => {
  const { id, x, y, empty } = result

  const [modalOpen, setModalOpen] = useState(false)

  const openModal = useCallback(() => {
    setModalOpen(true)
  }, [])
  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const { icon, name } = dataItem(id as string) || {}

  return (
    <>
      <GridCell $x={x} $y={y} key={`${x}-${y}`} onClick={openModal}>
        <Avatar src={icon} alt={name} sx={{ width: ICON_WIDTH, height: ICON_WIDTH, backgroundColor: '#07071f' }}>
          {empty ? 'x' : null}
        </Avatar>
      </GridCell>

      <Dialog onClose={closeModal} open={modalOpen} onBackdropClick={closeModal}>
        <DialogTitle>Computer says this is {name || 'empty'}. Is that wrong?</DialogTitle>
        <DialogContent>
          <Typography>
            First, did you upload full, uncompressed screenshot straight from the game? No cropping, no editing? No
            third party screenshot tools? This thing needs as much image quality as it can get.{' '}
            <strong>If you have doubts, please try again with a better image.</strong> More resolution, more better.
          </Typography>

          <Typography sx={{ mt: 1 }}>
            Second, did the left side window show your archnemesis inventory, and only that? The 8 by 8 grid?{' '}
            <strong>If no, the issue is screenshot alignment.</strong> If you cropped the screenshot, try again with a
            full-size one.
          </Typography>

          <Typography sx={{ mt: 1 }}>
            If the above did not help, submit a bug report. Please first look over the already open issues, and try not
            to create duplicates. Include the full in-game screenshot, not edited or cropped in any way. Ideally, as a
            dropbox / imgur / ... link, because GitHub compresses in-line images. Describe what was mis-identified. And
            include the debug text from below. All of it, it scrolls! All clear? Then go{' '}
            <Link href='https://github.com/tmikoss/archnemesis-detector/issues' target='_blank'>
              here
            </Link>
            . And please be patient, this is something I do in my already scarce free time :(
          </Typography>
        </DialogContent>

        <JsonContainer>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </JsonContainer>
      </Dialog>
    </>
  )
}

const ResultsGrid: React.FC<Props> = ({ parseResults }) => {
  const cells = map(parseResults, (result, idx) => <ResultsGridCell result={result} key={idx} />)

  return <GridContainer>{cells}</GridContainer>
}

const ResultsList: React.FC<Props> = ({ parseResults }) => {
  const grouped = useMemo(() => {
    const counted = countBy(
      filter(parseResults, ({ empty }) => !empty),
      'id'
    )

    const withData = map(counted, (count, id) => {
      const { icon, name } = dataItem(id)

      return { id, name, icon, count }
    })

    return sortBy(withData, 'name')
  }, [parseResults])

  const listItems = map(grouped, ({ name, icon, id, count }) => {
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

  return <List dense>{listItems}</List>
}

export const Results: React.FC<Props> = ({ parseResults }) => {
  const [tab, setTab] = useState('grid')

  const progress = Math.min(Math.ceil((parseResults.length * 100) / 64), 100)

  return (
    <>
      <Tabs value={tab} onChange={(_e, newTab) => setTab(newTab)}>
        <Tab label='Grid' value='grid' />
        <Tab label='List' value='list' />
      </Tabs>
      <Paper sx={{ p: 2 }}>
        {tab === 'grid' && <ResultsGrid parseResults={parseResults} />}
        {tab === 'list' && <ResultsList parseResults={parseResults} />}
      </Paper>

      {progress < 100 ? <LinearProgress variant='determinate' value={progress} sx={{ mt: 2 }} /> : null}
    </>
  )
}
