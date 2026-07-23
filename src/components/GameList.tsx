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
      g.eco.toLowerCase().includes(q) ||
      g.id.toString() === q.replace('#', '')
    )
  })

  return (
    <div className="flex flex-col h-full bg-chess-dark border-r border-zinc-800/80">
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-chess-gold tracking-wide">The 60 Games</h2>
          <span className="text-[11px] text-zinc-500 font-mono">{filtered.length}/60</span>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search title, player, year, ECO..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-chess-gold/60 focus:border-chess-gold/40 transition"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto game-list">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-sm">No games match</div>
        ) : (
          filtered.map(game => {
            const isSelected = game.id === selectedId
            const isFischerWhite = game.white.includes('Fischer')
            const opponent = isFischerWhite
              ? game.black.split(',')[0].split(' ').slice(-1)[0]
              : game.white.split(',')[0].split(' ').slice(-1)[0]

            return (
              <button
                key={game.id}
                onClick={() => onSelect(game.id)}
                className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-all duration-150 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-l-[3px] border-l-chess-gold'
                    : 'hover:bg-zinc-900/70 border-l-[3px] border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-zinc-500 tracking-wider">#{String(game.id).padStart(2, '0')}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md tracking-wide ${
                    game.result === '1-0'
                      ? 'bg-emerald-950/60 text-emerald-400'
                      : game.result === '0-1'
                      ? 'bg-rose-950/60 text-rose-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {game.result}
                  </span>
                </div>
                <p className={`font-medium text-[13px] mt-1.5 leading-snug ${isSelected ? 'text-white' : 'text-zinc-100'}`}>
                  {game.title}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {isFischerWhite ? (
                    <>
                      <span className="text-chess-gold/90">Fischer</span>
                      <span className="text-zinc-600"> vs </span>
                      {opponent}
                    </>
                  ) : (
                    <>
                      {opponent}
                      <span className="text-zinc-600"> vs </span>
                      <span className="text-chess-gold/90">Fischer</span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                  <span>{game.year}</span>
                  {game.eco && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="font-mono text-zinc-500">{game.eco}</span>
                    </>
                  )}
                </p>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
