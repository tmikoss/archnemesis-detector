
import { find } from 'lodash'
import { DATA, DataItem } from './assets'

export const ICONS_PER_ROW = 8
export const ICON_WIDTH = 48

export const dataItem = (id: string) => find(DATA, { id }) as DataItem
