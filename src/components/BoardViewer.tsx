import { useEffect, useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { FischerGame } from '../lib/parseGames'

interface Props {
  game: FischerGame | null
}

export function BoardViewer({ game }: Props) {
  const [chess] = useState(() => new Chess())
  const [fen, setFen] = useState('start')
  const [moveIndex, setMoveIndex] = useState(0)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [autoPlay, setAutoPlay] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  // Load game
  useEffect(() => {
    if (!game) return
    try {
      chess.reset()
      chess.loadPgn(game.pgn)
      const moves = chess.history()
      setHistory(moves)
      setMoveIndex(0)
      chess.reset()
      setFen(chess.fen())
      // Orient so Fischer is at the bottom when possible
      const fischerIsWhite = game.white.includes('Fischer')
      setOrientation(fischerIsWhite ? 'white' : 'black')
      setAutoPlay(false)
    } catch (e) {
      console.error('Failed to load PGN', e)
    }
  }, [game, chess])

  // Apply moves up to index
  const goToMove = useCallback((index: number) => {
    if (!game) return
    chess.reset()
    const moves = history.slice(0, index)
    for (const m of moves) {
      chess.move(m)
    }
    setFen(chess.fen())
    setMoveIndex(index)
  }, [chess, history, game])

  // Auto play
  useEffect(() => {
    if (!autoPlay || moveIndex >= history.length) {
      if (moveIndex >= history.length) setAutoPlay(false)
      return
    }
    const t = setTimeout(() => {
      goToMove(moveIndex + 1)
    }, 900)
    return () => clearTimeout(t)
  }, [autoPlay, moveIndex, history.length, goToMove])

  const currentMoveSan = history[moveIndex - 1] || null

  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Select a game to begin
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 overflow-hidden">
      {/* Board */}
      <div className="flex flex-col items-center">
        <div className="board-container rounded-lg overflow-hidden max-w-[min(100%,560px)] w-full aspect-square">
          <Chessboard
            position={fen}
            boardOrientation={orientation}
            arePiecesDraggable={false}
            customBoardStyle={{
              borderRadius: '8px',
            }}
            customDarkSquareStyle={{ backgroundColor: '#779952' }}
            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          <button
            onClick={() => goToMove(0)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            title="Start"
          >
            ⏮
          </button>
          <button
            onClick={() => goToMove(Math.max(0, moveIndex - 1))}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
          >
            ◀
          </button>
          <button
            onClick={() => setAutoPlay(p => !p)}
            className={`px-4 py-1.5 rounded text-sm font-medium ${
              autoPlay ? 'bg-chess-gold text-black' : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            {autoPlay ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => goToMove(Math.min(history.length, moveIndex + 1))}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
          >
            ▶
          </button>
          <button
            onClick={() => goToMove(history.length)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            title="End"
          >
            ⏭
          </button>
          <button
            onClick={() => setOrientation(o => o === 'white' ? 'black' : 'white')}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm ml-2"
          >
            Flip
          </button>
        </div>

        <p className="text-xs text-zinc-500 mt-2">
          Move {moveIndex} / {history.length}
          {currentMoveSan && <span className="ml-2 text-chess-gold">{currentMoveSan}</span>}
        </p>
      </div>

      {/* Info + moves */}
      <div className="flex-1 min-w-0 flex flex-col max-w-md">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white leading-tight">
            #{game.id} · {game.title}
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            {game.white} vs {game.black}
          </p>
          <p className="text-zinc-500 text-sm mt-0.5">
            {game.event} · {game.date} · {game.eco} · <span className="text-chess-gold">{game.result}</span>
          </p>
        </div>

        {/* Move list */}
        <div className="flex-1 overflow-y-auto bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 text-sm font-mono">
            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => {
              const whiteMove = history[i * 2]
              const blackMove = history[i * 2 + 1]
              const whiteIdx = i * 2 + 1
              const blackIdx = i * 2 + 2
              return (
                <div key={i} className="contents">
                  <span className="text-zinc-600 text-right pr-1">{i + 1}.</span>
                  <button
                    onClick={() => goToMove(whiteIdx)}
                    className={`text-left px-1 rounded ${
                      moveIndex === whiteIdx ? 'bg-chess-gold/20 text-chess-gold' : 'hover:bg-zinc-800'
                    }`}
                  >
                    {whiteMove}
                  </button>
                  {blackMove ? (
                    <button
                      onClick={() => goToMove(blackIdx)}
                      className={`text-left px-1 rounded ${
                        moveIndex === blackIdx ? 'bg-chess-gold/20 text-chess-gold' : 'hover:bg-zinc-800'
                      }`}
                    >
                      {blackMove}
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
