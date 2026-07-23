import { useEffect, useState, useMemo } from 'react'
import { parseAllGames, FischerGame } from './lib/parseGames'
import { GameList } from './components/GameList'
import { BoardViewer } from './components/BoardViewer'

function App() {
  const [games, setGames] = useState<FischerGame[]>([])
  const [selectedId, setSelectedId] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMobileList, setShowMobileList] = useState(false)

  useEffect(() => {
    parseAllGames()
      .then(g => {
        setGames(g)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load the games. Please refresh.')
        setLoading(false)
      })
  }, [])

  const selectedGame = useMemo(
    () => games.find(g => g.id === selectedId) || null,
    [games, selectedId]
  )

  const currentIndex = useMemo(
    () => games.findIndex(g => g.id === selectedId),
    [games, selectedId]
  )

  const goPrev = () => {
    if (currentIndex > 0) setSelectedId(games[currentIndex - 1].id)
  }
  const goNext = () => {
    if (currentIndex < games.length - 1) setSelectedId(games[currentIndex + 1].id)
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-chess-darker text-zinc-400 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-chess-gold/10 border border-chess-gold/30 flex items-center justify-center text-3xl animate-pulse-gold">
          ♔
        </div>
        <div className="text-center">
          <p className="text-zinc-300 font-medium">Loading Fischer's 60 Memorable Games</p>
          <p className="text-xs text-zinc-600 mt-1">Preparing the boards…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-chess-darker text-rose-400">
        {error}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-chess-darker">
      {/* Header */}
      <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-zinc-800/80 bg-chess-dark/90 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chess-gold to-chess-gold-dim flex items-center justify-center text-black font-bold text-lg shadow-gold-glow">
            ♔
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              Fischer<span className="text-chess-gold">60</span>
            </h1>
            <p className="text-[11px] text-zinc-500 mt-0.5 tracking-wide">My 60 Memorable Games</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-zinc-500 hidden sm:block tracking-wide">
            Bobby Fischer · 1957–1967
          </div>
          {/* Mobile list toggle */}
          <button
            onClick={() => setShowMobileList(true)}
            className="md:hidden px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition"
          >
            Games
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - desktop */}
        <div className="w-72 lg:w-[300px] shrink-0 hidden md:block">
          <GameList
            games={games}
            selectedId={selectedId}
            onSelect={setSelectedId}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        {/* Board area */}
        <BoardViewer
          game={selectedGame}
          onPrevGame={goPrev}
          onNextGame={goNext}
          hasPrev={currentIndex > 0}
          hasNext={currentIndex < games.length - 1}
        />

        {/* Mobile game list overlay */}
        {showMobileList && (
          <div className="md:hidden absolute inset-0 z-30 flex flex-col bg-chess-darker">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h2 className="font-semibold text-chess-gold">Select Game</h2>
              <button
                onClick={() => setShowMobileList(false)}
                className="px-3 py-1 text-sm bg-zinc-800 rounded-lg"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <GameList
                games={games}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id)
                  setShowMobileList(false)
                }}
                search={search}
                onSearchChange={setSearch}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
