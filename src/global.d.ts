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

interface DispatchOverride {
  result: ParseResult
  override: string
}

interface ForcedOverride {
  override: string
  conditions: Array<{ id: string, min: number, max: number }>
}
