interface MatchResult {
  id: string
  match: number
}

interface ParseResult {
  x: number
  y: number
  empty: boolean
  id?: string
  matchedPct?: number
  topMatches?: MatchResult[]
}
