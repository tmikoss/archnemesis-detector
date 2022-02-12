import styled from 'styled-components'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { map, countBy, filter, sortBy, each, every, includes, uniq, flatMap, find, without } from 'lodash'
import {
  Avatar,
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
  Link,
  Grid,
  IconButton,
  Tooltip,
  Checkbox
} from '@mui/material'
import { dataItem, ICON_WIDTH, ICONS_PER_ROW } from './utils'
import { DATA, DataItem } from './assets'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

const RECIPE_PIN_KEY = 'pinned-recipe-ids'

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${ICONS_PER_ROW}, ${ICON_WIDTH}px);
  grid-template-rows: repeat(${ICONS_PER_ROW}, ${ICON_WIDTH}px);
`

const GridCell = styled.div<{ $x: number; $y: number }>`
  grid-column: ${({ $x }) => $x + 1};
  grid-row: ${({ $y }) => $y + 1};
  cursor: pointer;
`

const JsonContainer = styled.div`
  max-height: 50vh;
  overflow: scroll;
  padding: 2em;
  font-size: 0.75em;
`

const PreviewImg = styled.img`
  width: 100%;
  max-width: ${ICONS_PER_ROW * ICON_WIDTH}px;
`

const DetectedGridCell: React.FC<{ result: ParseResult }> = ({ result }) => {
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

export const DetectedGrid: React.FC<{ parseResults: ParseResult[] }> = ({ parseResults }) => {
  const cells = map(parseResults, (result, idx) => <DetectedGridCell result={result} key={idx} />)

  return (
    <>
      <Tabs value={0}>
        <Tab label='Detected' />
      </Tabs>
      <Paper sx={{ p: 2 }}>
        <GridContainer>{cells}</GridContainer>
      </Paper>
    </>
  )
}

export const Preview: React.FC<{ preview?: string }> = ({ preview }) => {
  return (
    <>
      <Tabs value={0}>
        <Tab label='Inventory' />
      </Tabs>
      <Paper sx={{ p: 2 }}>
        <PreviewImg src={preview} alt='This should contain exactly the archnemesis inventory from your screenshot' />
      </Paper>
    </>
  )
}

export const DetectedRecipes: React.FC<{ parseResults: ParseResult[] }> = ({ parseResults }) => {
  const [tab, setTab] = useState('available')

  return (
    <>
      <Tabs value={tab} onChange={(_e, newTab) => setTab(newTab)}>
        <Tab label='Available' value='available' />
        <Tab label='All recipes' value='all' />
        <Tab label='List' value='list' />
      </Tabs>
      <Paper sx={{ p: 2 }}>
        {tab === 'available' && <Recipes parseResults={parseResults} />}
        {tab === 'all' && <Recipes parseResults={parseResults} showAll />}
        {tab === 'list' && <ResultsList parseResults={parseResults} />}
      </Paper>
    </>
  )
}

const withRecipesAscending = sortBy(
  filter(DATA, ({ recipe }) => recipe.length > 0),
  ({ name, tier }) => [tier, name]
)

interface CustomizedDataItem extends DataItem {
  canMake: boolean
  missingToCraft: string[]
  pinned: boolean
}

const RecipeRow: React.FC<{
  item: CustomizedDataItem
  parseResults: ParseResult[]
  setPinnedIds: React.Dispatch<React.SetStateAction<string[]>>
}> = ({ item, parseResults, setPinnedIds }) => {
  const { id, name, icon, recipe, canMake, missingToCraft, pinned } = item

  const recipeItems = map(recipe, dataItem)

  const searchText = map(recipeItems, 'name').join('|')

  const partsText = map(recipeItems, ({ id, name }) => {
    const found = find(parseResults, { id })

    return (
      <Typography component='span' key={id} sx={{ mr: 2 }} color={found ? 'text.primary' : 'grey.700'}>
        {name}
      </Typography>
    )
  })

  let tooltipText = `Needs ${missingToCraft.length} drops to craft.`
  if (canMake) {
    tooltipText = `Can craft this now.`
  } else if (missingToCraft.length < 1) {
    tooltipText = `Needs intermediate crafts first, but you have the parts.`
  }

  return (
    <Grid container>
      <Grid item xs={2}>
        <Tooltip title={tooltipText}>
          <Badge
            overlap='circular'
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={canMake ? <CheckIcon /> : String(missingToCraft.length)}
          >
            <Avatar src={icon} />
          </Badge>
        </Tooltip>
      </Grid>
      <Grid item xs={8}>
        <ListItemText primary={name} secondary={partsText} primaryTypographyProps={{ color: 'primary' }} />
      </Grid>
      <Grid item xs={1}>
        <Tooltip title='Pin the recipe to always display it'>
          <Checkbox
            checked={pinned}
            onChange={(_e, checked) => setPinnedIds((was) => (checked ? [...was, id] : without(was, id)))}
          />
        </Tooltip>
      </Grid>
      <Grid item xs={1}>
        <Tooltip title='Copy in-game search string'>
          <IconButton onClick={() => navigator.clipboard.writeText(searchText)}>
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  )
}

const Recipes: React.FC<{ parseResults: ParseResult[]; showAll?: boolean }> = ({ parseResults, showAll }) => {
  const [pinnedIds, setPinnedIds] = useState<string[]>(JSON.parse(localStorage.getItem(RECIPE_PIN_KEY) || 'null') || [])

  useEffect(() => {
    localStorage.setItem(RECIPE_PIN_KEY, JSON.stringify(pinnedIds))
  }, [pinnedIds])

  const customizedRecipes = useMemo(() => {
    const foundItems = uniq(map(parseResults, 'id'))

    let customized: CustomizedDataItem[] = []

    const missingItemsFor = (id: string, alwaysCraft = false): string[] => {
      if (!alwaysCraft && includes(foundItems, id)) {
        return []
      } else {
        const { recipe } = dataItem(id)

        if (recipe.length < 1) {
          return [id]
        } else {
          return flatMap(recipe, (nextId) => missingItemsFor(nextId))
        }
      }
    }

    each(withRecipesAscending, (item) => {
      const { id, recipe } = item

      const missingToCraft = missingItemsFor(id, true)

      const canMake = every(recipe, (id) => includes(foundItems, id))

      customized.push({
        ...item,
        canMake,
        missingToCraft,
        pinned: includes(pinnedIds, id)
      })
    })

    return customized
  }, [parseResults, pinnedIds])

  const displayItems = filter(customizedRecipes, ({ canMake, pinned }) => showAll || canMake || pinned)

  const listItems = map(
    sortBy(displayItems, ({ tier, canMake, pinned, name }) => [pinned ? 0 : 1, canMake ? 0 : 1, 10 - tier, name]),
    (item) => <RecipeRow item={item} parseResults={parseResults} setPinnedIds={setPinnedIds} key={item.id} />
  )

  return <Grid container>{listItems}</Grid>
}

const ResultsList: React.FC<{ parseResults: ParseResult[] }> = ({ parseResults }) => {
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
