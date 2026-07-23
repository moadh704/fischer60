import { useEffect, useState } from 'react'
import { parseAllGames, FischerGame } from './lib/parseGames'
import { GameList } from './components/GameList'
import { BoardViewer } from './components/BoardViewer'

function App() {
  const [games, setGames] = useState<FischerGame[]>([])
  const [selectedId, setSelectedId] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    parseAllGames()
      .then(g => {
        setGames(g)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const selectedGame = games.find(g => g.id === selectedId) || null

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-chess-darker text-zinc-400">
        Loading Fischer's 60 memorable games...
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-chess-darker">
      {/* Header */}
      <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-zinc-800 bg-chess-dark shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-chess-gold flex items-center justify-center text-black font-bold text-lg">
            ♔
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Fischer<span className="text-chess-gold">60</span>
            </h1>
            <p className="text-xs text-zinc-500 -mt-0.5">My 60 Memorable Games</p>
          </div>
        </div>
        <div className="text-xs text-zinc-500 hidden sm:block">
          Bobby Fischer · 1957–1967
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 lg:w-80 shrink-0 hidden md:block">
          <GameList
            games={games}
            selectedId={selectedId}
            onSelect={setSelectedId}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        {/* Board area */}
        <BoardViewer game={selectedGame} />
      </div>

      {/* Mobile game selector (simple) */}
      <div className="md:hidden border-t border-zinc-800 bg-chess-dark p-2 overflow-x-auto flex gap-2">
        {games.slice(0, 20).map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedId(g.id)}
            className={`shrink-0 px-3 py-1.5 rounded text-xs ${
              selectedId === g.id ? 'bg-chess-gold text-black' : 'bg-zinc-800'
            }`}
          >
            #{g.id}
          </button>
        ))}
        <span className="text-zinc-600 text-xs self-center">…</span>
      </div>
    </div>
  )
}

export default App
