import { FischerGame } from '../lib/parseGames'

interface Props {
  games: FischerGame[]
  selectedId: number
  onSelect: (id: number) => void
  search: string
  onSearchChange: (s: string) => void
}

export function GameList({ games, selectedId, onSelect, search, onSearchChange }: Props) {
  const filtered = games.filter(g => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      g.title.toLowerCase().includes(q) ||
      g.white.toLowerCase().includes(q) ||
      g.black.toLowerCase().includes(q) ||
      g.event.toLowerCase().includes(q) ||
      g.year.toString().includes(q) ||
      g.eco.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-full bg-chess-dark border-r border-zinc-800">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-chess-gold mb-3">The 60 Games</h2>
        <input
          type="text"
          placeholder="Search games, players, year..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-chess-gold"
        />
        <p className="text-xs text-zinc-500 mt-2">{filtered.length} games</p>
      </div>

      <div className="flex-1 overflow-y-auto game-list">
        {filtered.map(game => {
          const isSelected = game.id === selectedId
          const isFischerWhite = game.white.includes('Fischer')
          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-800/60 transition-colors ${
                isSelected
                  ? 'bg-zinc-800/80 border-l-2 border-l-chess-gold'
                  : 'hover:bg-zinc-900/80 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono text-zinc-500">#{game.id}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  game.result === '1-0' ? 'bg-emerald-900/40 text-emerald-400' :
                  game.result === '0-1' ? 'bg-rose-900/40 text-rose-400' :
                  'bg-zinc-700 text-zinc-300'
                }`}>
                  {game.result}
                </span>
              </div>
              <p className="font-medium text-sm text-white mt-1 leading-snug">{game.title}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {isFischerWhite ? (
                  <>Fischer vs {game.black.split(' ').slice(-1)[0]}</>
                ) : (
                  <>{game.white.split(' ').slice(-1)[0]} vs Fischer</>
                )}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {game.year} · {game.eco || '—'}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
