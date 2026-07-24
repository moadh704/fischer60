import { useEffect, useState, useCallback, useRef, type CSSProperties } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { FischerGame } from '../lib/parseGames'

interface Props {
  game: FischerGame | null
  onPrevGame?: () => void
  onNextGame?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

function getCaptured(fen: string) {
  const pieceCount: Record<string, number> = {
    P: 8, N: 2, B: 2, R: 2, Q: 1,
    p: 8, n: 2, b: 2, r: 2, q: 1,
  }
  const board = fen.split(' ')[0]
  for (const c of board) {
    if (pieceCount[c] !== undefined) pieceCount[c]--
  }
  const whiteCaptured: string[] = []
  const blackCaptured: string[] = []
  for (const [p, missing] of Object.entries(pieceCount)) {
    if (missing <= 0) continue
    if (p === p.toUpperCase()) {
      for (let i = 0; i < missing; i++) blackCaptured.push(p.toLowerCase())
    } else {
      for (let i = 0; i < missing; i++) whiteCaptured.push(p.toUpperCase())
    }
  }
  const sortFn = (a: string, b: string) => (PIECE_VALUES[b.toLowerCase()] || 0) - (PIECE_VALUES[a.toLowerCase()] || 0)
  whiteCaptured.sort(sortFn)
  blackCaptured.sort(sortFn)
  return { whiteCaptured, blackCaptured }
}

const PIECE_SYMBOLS: Record<string, string> = {
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕',
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛',
}

export function BoardViewer({ game, onPrevGame, onNextGame, hasPrev, hasNext }: Props) {
  const [chess] = useState(() => new Chess())
  const [fen, setFen] = useState('start')
  const [moveIndex, setMoveIndex] = useState(0)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [autoPlay, setAutoPlay] = useState(false)
  const [speed, setSpeed] = useState(800)
  const [history, setHistory] = useState<string[]>([])
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

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
      setLastMove(null)
      const fischerIsWhite = game.white.includes('Fischer')
      setOrientation(fischerIsWhite ? 'white' : 'black')
      setAutoPlay(false)
    } catch (e) {
      console.error('Failed to load PGN', e)
    }
  }, [game, chess])

  const goToMove = useCallback((index: number) => {
    if (!game) return
    chess.reset()
    const moves = history.slice(0, index)
    let lastFromTo: { from: string; to: string } | null = null
    for (const m of moves) {
      const result = chess.move(m)
      if (result) {
        lastFromTo = { from: result.from, to: result.to }
      }
    }
    setFen(chess.fen())
    setMoveIndex(index)
    setLastMove(lastFromTo)
  }, [chess, history, game])

  useEffect(() => {
    if (!autoPlay || moveIndex >= history.length) {
      if (moveIndex >= history.length) setAutoPlay(false)
      return
    }
    const t = setTimeout(() => {
      goToMove(moveIndex + 1)
    }, speed)
    return () => clearTimeout(t)
  }, [autoPlay, moveIndex, history.length, goToMove, speed])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToMove(Math.max(0, moveIndex - 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          goToMove(Math.min(history.length, moveIndex + 1))
          break
        case ' ':
          e.preventDefault()
          setAutoPlay(p => !p)
          break
        case 'Home':
          e.preventDefault()
          goToMove(0)
          break
        case 'End':
          e.preventDefault()
          goToMove(history.length)
          break
        case 'f':
        case 'F':
          setOrientation(o => (o === 'white' ? 'black' : 'white'))
          break
        case 'n':
        case 'N':
          if (hasNext && onNextGame) onNextGame()
          break
        case 'p':
        case 'P':
          if (hasPrev && onPrevGame) onPrevGame()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goToMove, moveIndex, history.length, hasNext, hasPrev, onNextGame, onPrevGame])

  const copyPgn = () => {
    if (!game) return
    navigator.clipboard.writeText(game.pgn).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const currentMoveSan = history[moveIndex - 1] || null
  const { whiteCaptured, blackCaptured } = getCaptured(fen)

  const customSquareStyles: Record<string, CSSProperties> = {}
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(212, 175, 55, 0.35)' }
    customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(212, 175, 55, 0.55)' }
  }

  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Select a game to begin
      </div>
    )
  }

  const isFischerWhite = game.white.includes('Fischer')

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-5 p-4 lg:p-6 overflow-hidden animate-fade-in">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-full max-w-[min(100%,540px)] mb-3 flex items-center justify-between text-sm">
          <div className={`flex items-center gap-2 ${orientation === 'black' ? 'order-2' : ''}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
            <span className={isFischerWhite && orientation === 'white' || !isFischerWhite && orientation === 'black' ? 'text-chess-gold font-medium' : 'text-zinc-300'}>
              {orientation === 'white' ? game.white : game.black}
            </span>
          </div>
          <div className={`flex items-center gap-2 ${orientation === 'black' ? 'order-1' : ''`}>
            <span className={isFischerWhite && orientation === 'black' || !isFischerWhite && orientation === 'white' ? 'text-chess-gold font-medium' : 'text-zinc-300'}>
              {orientation === 'white' ? game.black : game.white}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-zinc-500" />
          </div>
        </div>

        <div ref={boardRef} className="board-container rounded-xl overflow-hidden max-w-[min(100%,540px)] w-full aspect-square">
          <Chessboard
            position={fen}
            boardOrientation={orientation}
            arePiecesDraggable={false}
            customBoardStyle={{
              borderRadius: '12px',
            }}
            customDarkSquareStyle={{ backgroundColor: '#779952' }}
            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
            customSquareStyles={customSquareStyles}
          />
        </div>

        <div className="w-full max-w-[min(100%,540px)] mt-3 flex justify-between text-lg leading-none tracking-tight">
          <div className="flex gap-0.5 text-zinc-400 min-h-[1.4rem]">
            {(orientation === 'white' ? blackCaptured : whiteCaptured).map((p, i) => (
              <span key={i} className="opacity-80">{PIECE_SYMBOLS[p] || p}</span>
            ))}
          </div>
          <div className="flex gap-0.5 text-zinc-300 min-h-[1.4rem]">
            {(orientation === 'white' ? whiteCaptured : blackCaptured).map((p, i) => (
              <span key={i} className="opacity-90">{PIECE_SYMBOLS[p] || p}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-4 flex-wrap justify-center">
          <button
            onClick={() => onPrevGame?.()}
            disabled={!hasPrev}
            className="btn-press px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition"
            title="Previous game (P)"
          >
            ‹‹
          </button>
          <button
            onClick={() => goToMove(0)}
            className="btn-press px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition"
            title="Start (Home)"
          >
            ⏮
          </button>
          <button
            onClick={() => goToMove(Math.max(0, moveIndex - 1))}
            className="btn-press px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition"
            title="Previous move (←)"
          >
            ◀
          </button>
          <button
            onClick={() => setAutoPlay(p => !p)}
            className={'btn-press px-4 py-1.5 rounded-lg text-sm font-semibold transition ' + (autoPlay ? 'bg-chess-gold text-black shadow-gold-glow' : 'bg-zinc-800/80 hover:bg-zinc-700')}
            title="Play / Pause (Space)"
          >
            {autoPlay ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => goToMove(Math.min(history.length, moveIndex + 1))}
            className="btn-press px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition"
            title="Next move (→)"
          >
            ▶
          </button>
          <button
            onClick={() => goToMove(history.length)}
            className="btn-press px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition"
            title="End (End)"
          >
            ⏭
          </button>
          <button
            onClick={() => onNextGame?.()}
            disabled={!hasNext}
            className="btn-press px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition"
            title="Next game (N)"
          >
            ››
          </button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          <button
            onClick={() => setOrientation(o => (o === 'white' ? 'black' : 'white'))}
            className="btn-press px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition"
            title="Flip board (F)"
          >
            ↻
          </button>

          <select
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="bg-zinc-800/80 border border-zinc-700 text-xs rounded-lg px-2 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-chess-gold"
            title="Autoplay speed"
          >
            <option value={1400}>Slow</option>
            <option value={800}>Normal</option>
            <option value={400}>Fast</option>
            <option value={180}>Blitz</option>
          </select>
        </div>

        <p className="text-xs text-zinc-500 mt-2.5 flex items-center gap-2">
          <span>Move {moveIndex} / {history.length}</span>
          {currentMoveSan && (
            <span className="text-chess-gold font-mono font-medium">{currentMoveSan}</span>
          )}
        </p>

        <p className="text-[10px] text-zinc-600 mt-1 hidden sm:block">
          ← → moves · Space play · F flip · N/P games
        </p>
      </div>

      <div className="flex-1 min-w-0 flex flex-col max-w-lg">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight tracking-tight">
                <span className="text-chess-gold">#{game.id}</span>
                <span className="mx-2 text-zinc-600">·</span>
                {game.title}
              </h1>
              <p className="text-zinc-400 mt-1.5 text-sm">
                <span className={isFischerWhite ? 'text-chess-gold-light font-medium' : ''}>
                  {game.white}
                </span>
                <span className="text-zinc-600 mx-1.5">vs</span>
                <span className={!isFischerWhite ? 'text-chess-gold-light font-medium' : ''}>
                  {game.black}
                </span>
              </p>
              <p className="text-zinc-500 text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>{game.event}</span>
                <span className="text-zinc-700">·</span>
                <span>{game.date}</span>
                {game.eco && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="font-mono text-zinc-400">{game.eco}</span>
                  </>
                )}
                <span className="text-zinc-700">·</span>
                <span className={'font-semibold ' + (game.result === '1-0' ? 'text-emerald-400' : game.result === '0-1' ? 'text-rose-400' : 'text-zinc-300')}>
                  {game.result}
                </span>
              </p>
            </div>

            <button
              onClick={copyPgn}
              className="btn-press shrink-0 px-3 py-1.5 text-xs bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
              title="Copy PGN"
            >
              {copied ? '✓ Copied' : 'Copy PGN'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto move-list glass rounded-xl p-3.5">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-0.5 text-sm font-mono">
            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => {
              const whiteMove = history[i * 2]
              const blackMove = history[i * 2 + 1]
              const whiteIdx = i * 2 + 1
              const blackIdx = i * 2 + 2
              return (
                <div key={i} className="contents">
                  <span className="text-zinc-600 text-right pr-1 select-none">{i + 1}.</span>
                  <button
                    onClick={() => goToMove(whiteIdx)}
                    className={'text-left px-1.5 py-0.5 rounded transition ' + (moveIndex === whiteIdx ? 'move-active' : 'hover:bg-zinc-800/80 text-zinc-200')}
                  >
                    {whiteMove}
                  </button>
                  {blackMove ? (
                    <button
                      onClick={() => goToMove(blackIdx)}
                      className={'text-left px-1.5 py-0.5 rounded transition ' + (moveIndex === blackIdx ? 'move-active' : 'hover:bg-zinc-800/80 text-zinc-200')}
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
