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
