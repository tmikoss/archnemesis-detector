import { createContext, useContext, useMemo, useState } from 'react'

const HighlightsContext = createContext({
  highlights: [] as string[],
  setHighlights: (x: string[]) => {}
})

export const useHighlights = () => useContext(HighlightsContext)

export const HighlightProvider: React.FC = ({ children }) => {
  const [highlights, setHighlights] = useState<string[]>([])

  const value = useMemo(() => ({ highlights, setHighlights }), [highlights])

  return <HighlightsContext.Provider value={value}>{children}</HighlightsContext.Provider>
}
