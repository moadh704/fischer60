import { Chess } from 'chess.js'
import { GAME_TITLES } from '../data/games'

export interface FischerGame {
  id: number
  title: string
  event: string
  site: string
  date: string
  white: string
  black: string
  result: string
  eco: string
  pgn: string
  year: number
}

export async function parseAllGames(): Promise<FischerGame[]> {
  const response = await fetch('./fischer60.pgn')
  const FULL_PGN = await response.text()

  const games: FischerGame[] = []
  const rawGames = FULL_PGN.trim().split(/\n\n(?=\[Event)/)

  rawGames.forEach((raw, index) => {
    try {
      const chess = new Chess()
      chess.loadPgn(raw)
      const headers = chess.header()

      const yearMatch = (headers.Date || '').match(/(\d{4})/)
      const year = yearMatch ? parseInt(yearMatch[1]) : 0

      games.push({
        id: index + 1,
        title: GAME_TITLES[index] || `Game ${index + 1}`,
        event: headers.Event || '',
        site: headers.Site || '',
        date: headers.Date || '',
        white: headers.White || '',
        black: headers.Black || '',
        result: headers.Result || '*',
        eco: headers.ECO || '',
        pgn: raw.trim(),
        year,
      })
    } catch (e) {
      console.warn(`Failed to parse game ${index + 1}`, e)
    }
  })

  return games
}
