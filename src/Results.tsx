import styled from 'styled-components'
import { useMemo, useState } from 'react'
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
  Tab
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
`

interface Props {
  parseResults: ParseResult[]
}

const ResultsGrid: React.FC<Props> = ({ parseResults }) => {
  const cells = map(parseResults, ({ id, x, y }) => {
    let content: React.ReactNode = NBSP

    if (id) {
      const { icon, name } = dataItem(id)

      content = <Avatar src={icon} alt={name} sx={{ width: ICON_WIDTH, height: ICON_WIDTH }} />
    }

    return (
      <GridCell $x={x} $y={y} key={`${x}-${y}`}>
        {content}
      </GridCell>
    )
  })

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
