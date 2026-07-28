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

type SoundType = 'move' | 'capture' | 'check' | 'castle' | 'promote'

const SOUND_URLS: Record<SoundType, string> = {
  move: 'https://raw.githubusercontent.com/harrenray/Chess-Sounds/main/move-self.mp3',
  capture: 'https://raw.githubusercontent.com/harrenray/Chess-Sounds/main/capture.mp3',
  check: 'https://raw.githubusercontent.com/harrenray/Chess-Sounds/main/move-check.mp3',
  castle: 'https://raw.githubusercontent.com/harrenray/Chess-Sounds/main/castle.mp3',
  promote: 'https://raw.githubusercontent.com/harrenray/Chess-Sounds/main/promote.mp3',
}

/** Keep board size a clean multiple of 8 to avoid zoom artifacts. */
function snapToSquareGrid(size: number): number {
  const snapped = Math.floor(size / 8) * 8
  return Math.max(240, Math.min(560, snapped))
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
  const [boardWidth, setBoardWidth] = useState(320)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const boardWrapperRef = useRef<HTMLDivElement>(null)
  const soundEnabledRef = useRef(true)
  const audioCache = useRef<Partial<Record<SoundType, HTMLAudioElement>>>({})

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    ;(Object.keys(SOUND_URLS) as SoundType[]).forEach((type) => {
      const audio = new Audio(SOUND_URLS[type])
      audio.preload = 'auto'
      audio.volume = 0.55
      audioCache.current[type] = audio
    })
  }, [])

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabledRef.current) return
    const audio = audioCache.current[type]
    if (!audio) return
    try {
      audio.currentTime = 0
      void audio.play()
    } catch {
      // ignore
    }
  }, [])

  // Robust sizing with ResizeObserver + multiple of 8
  useEffect(() => {
    const el = boardWrapperRef.current
    if (!el) return

    const update = () => {
      const available = Math.min(el.clientWidth, el.clientHeight || el.clientWidth)
      const next = snapToSquareGrid(available)
      setBoardWidth((prev) => (prev === next ? prev : next))
    }

    update()

    const ro = new ResizeObserver(() => requestAnimationFrame(update))
    ro.observe(el)
    window.addEventListener('resize', update)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

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

  const goToMove = useCallback(
    (index: number) => {
      if (!game) return

      const previousIndex = moveIndex
      chess.reset()
      const moves = history.slice(0, index)
      let lastFromTo: { from: string; to: string } | null = null
      let lastResult: ReturnType<Chess['move']> | null = null

      for (const m of moves) {
        const result = chess.move(m)
        if (result) {
          lastFromTo = { from: result.from, to: result.to }
          lastResult = result
        }
      }

      setFen(chess.fen())
      setMoveIndex(index)
      setLastMove(lastFromTo)

      if (index > previousIndex && lastResult) {
        const flags = lastResult.flags

        if (flags.includes('c') || flags.includes('e')) {
          playSound('capture')
        } else if (flags.includes('k') || flags.includes('q')) {
          playSound('castle')
        } else if (flags.includes('p')) {
          playSound('promote')
        } else {
          playSound('move')
        }

        if (chess.isCheck()) {
          setTimeout(() => playSound('check'), 70)
        }
      }
    },
    [chess, history, game, moveIndex, playSound]
  )

  useEffect(() => {
    if (!autoPlay || moveIndex >= history.length) {
      if (moveIndex >= history.length) setAutoPlay(false)
      return
    }
    const t = setTimeout(() => goToMove(moveIndex + 1), speed)
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
          setAutoPlay((p) => !p)
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
          setOrientation((o) => (o === 'white' ? 'black' : 'white'))
          break
        case 'n':
        case 'N':
          if (hasNext && onNextGame) onNextGame()
          break
        case 'p':
        case 'P':
          if (hasPrev && onPrevGame) onPrevGame()
          break
        case 'm':
        case 'M':
          setSoundEnabled((s) => !s)
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
      <div className="flex-1 flex items-center justify-center text-zinc-500 px-4">
        Select a game to begin
      </div>
    )
  }

  const isFischerWhite = game.white.includes('Fischer')

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-3 sm:gap-4 lg:gap-5 p-2 sm:p-3 lg:p-5 overflow-hidden animate-fade-in">
      {/* ===== BOARD COLUMN ===== */}
      <div className="flex flex-col items-center shrink-0 w-full xl:w-auto xl:max-w-[560px]">
        {/* Player names - compact on mobile */}
        <div
          className="mb-1.5 sm:mb-2 flex items-center justify-between text-xs sm:text-sm w-full px-0.5"
          style={{ maxWidth: boardWidth }}
        >
          <div className={`flex items-center gap-1.5 min-w-0 ${orientation === 'black' ? 'order-2' : ''}`}>
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-zinc-200 shrink-0" />
            <span
              className={`truncate ${
                (isFischerWhite && orientation === 'white') || (!isFischerWhite && orientation === 'black')
                  ? 'text-chess-gold font-medium'
                  : 'text-zinc-300'
              }`}
            >
              {orientation === 'white' ? game.white : game.black}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 min-w-0 ${orientation === 'black' ? 'order-1' : ''`}>
            <span
              className={`truncate text-right ${
                (isFischerWhite && orientation === 'black') || (!isFischerWhite && orientation === 'white')
                  ? 'text-chess-gold font-medium'
                  : 'text-zinc-300'
              }`}
            >
              {orientation === 'white' ? game.black : game.white}
            </span>
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-zinc-700 border border-zinc-500 shrink-0" />
          </div>
        </div>

        {/* Board */}
        <div
          ref={boardWrapperRef}
          className="w-full aspect-square max-w-[560px] flex items-center justify-center"
        >
          <div
            className="board-container rounded-lg sm:rounded-xl overflow-hidden"
            style={{
              width: boardWidth,
              height: boardWidth,
              transform: 'translateZ(0)',
            }}
          >
            <Chessboard
              position={fen}
              boardOrientation={orientation}
              boardWidth={boardWidth}
              arePiecesDraggable={false}
              customBoardStyle={{
                borderRadius: '8px',
              }}
              customDarkSquareStyle={{ backgroundColor: '#779952' }}
              customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
              customSquareStyles={customSquareStyles}
            />
          </div>
        </div>

        {/* Captured pieces */}
        <div
          className="mt-1.5 sm:mt-2 flex justify-between text-base sm:text-lg leading-none tracking-tight w-full px-0.5"
          style={{ maxWidth: boardWidth }}
        >
          <div className="flex gap-0.5 text-zinc-400 min-h-[1.2rem]">
            {(orientation === 'white' ? blackCaptured : whiteCaptured).map((p, i) => (
              <span key={i} className="opacity-80">
                {PIECE_SYMBOLS[p] || p}
              </span>
            ))}
          </div>
          <div className="flex gap-0.5 text-zinc-300 min-h-[1.2rem]">
            {(orientation === 'white' ? whiteCaptured : blackCaptured).map((p, i) => (
              <span key={i} className="opacity-90">
                {PIECE_SYMBOLS[p] || p}
              </span>
            ))}
          </div>
        </div>

        {/* Controls - more compact + better touch targets on mobile */}
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3 flex-wrap justify-center max-w-full">
          <button
            onClick={() => onPrevGame?.()}
            disabled={!hasPrev}
            className="btn-press min-w-[36px] h-9 sm:h-auto px-2 sm:px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition active:scale-95"
            title="Previous game (P)"
          >
            ‹‹
          </button>
          <button
            onClick={() => goToMove(0)}
            className="btn-press min-w-[36px] h-9 sm:h-auto px-2 sm:px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition active:scale-95"
            title="Start (Home)"
          >
            ⏮
          </button>
          <button
            onClick={() => goToMove(Math.max(0, moveIndex - 1))}
            className="btn-press min-w-[40px] h-9 sm:h-auto px-2.5 sm:px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition active:scale-95"
            title="Previous move (←)"
          >
            ◀
          </button>
          <button
            onClick={() => setAutoPlay((p) => !p)}
            className={
              'btn-press min-w-[64px] h-9 sm:h-auto px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition active:scale-95 ' +
              (autoPlay ? 'bg-chess-gold text-black shadow-gold-glow' : 'bg-zinc-800/80 hover:bg-zinc-700')
            }
            title="Play / Pause (Space)"
          >
            {autoPlay ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => goToMove(Math.min(history.length, moveIndex + 1))}
            className="btn-press min-w-[40px] h-9 sm:h-auto px-2.5 sm:px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition active:scale-95"
            title="Next move (→)"
          >
            ▶
          </button>
          <button
            onClick={() => goToMove(history.length)}
            className="btn-press min-w-[36px] h-9 sm:h-auto px-2 sm:px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition active:scale-95"
            title="End (End)"
          >
            ⏭
          </button>
          <button
            onClick={() => onNextGame?.()}
            disabled={!hasNext}
            className="btn-press min-w-[36px] h-9 sm:h-auto px-2 sm:px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition active:scale-95"
            title="Next game (N)"
          >
            ››
          </button>

          <div className="w-px h-5 bg-zinc-700 mx-0.5 hidden xs:block" />

          <button
            onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}
            className="btn-press min-w-[36px] h-9 sm:h-auto px-2 sm:px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm transition active:scale-95"
            title="Flip board (F)"
          >
            ↻
          </button>

          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className={
              'btn-press min-w-[36px] h-9 sm:h-auto px-2 sm:px-2.5 py-1.5 rounded-lg text-sm transition active:scale-95 ' +
              (soundEnabled ? 'bg-zinc-800/80 hover:bg-zinc-700' : 'bg-zinc-900 text-zinc-500')
            }
            title="Toggle sound (M)"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-9 sm:h-auto bg-zinc-800/80 border border-zinc-700 text-xs rounded-lg px-1.5 sm:px-2 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-chess-gold"
            title="Autoplay speed"
          >
            <option value={1400}>Slow</option>
            <option value={800}>Normal</option>
            <option value={400}>Fast</option>
            <option value={180}>Blitz</option>
          </select>
        </div>

        <p className="text-xs text-zinc-500 mt-1.5 sm:mt-2 flex items-center gap-2">
          <span>
            Move {moveIndex} / {history.length}
          </span>
          {currentMoveSan && (
            <span className="text-chess-gold font-mono font-medium">{currentMoveSan}</span>
          )}
        </p>

        <p className="text-[10px] text-zinc-600 mt-0.5 hidden sm:block">
          ← → moves · Space play · F flip · M sound · N/P games
        </p>
      </div>

      {/* ===== GAME INFO + MOVES ===== */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0 xl:max-w-lg">
        {/* Title block - more compact on mobile */}
        <div className="mb-2 sm:mb-3 shrink-0 px-0.5">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight tracking-tight truncate">
                <span className="text-chess-gold">#{game.id}</span>
                <span className="mx-1.5 sm:mx-2 text-zinc-600">·</span>
                {game.title}
              </h1>
              <p className="text-zinc-400 mt-1 text-xs sm:text-sm truncate">
                <span className={isFischerWhite ? 'text-chess-gold-light font-medium' : ''}>
                  {game.white}
                </span>
                <span className="text-zinc-600 mx-1">vs</span>
                <span className={!isFischerWhite ? 'text-chess-gold-light font-medium' : ''}>
                  {game.black}
                </span>
              </p>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="truncate max-w-[140px] sm:max-w-none">{game.event}</span>
                <span className="text-zinc-700">·</span>
                <span>{game.date}</span>
                {game.eco && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="font-mono text-zinc-400">{game.eco}</span>
                  </>
                )}
                <span className="text-zinc-700">·</span>
                <span
                  className={
                    'font-semibold ' +
                    (game.result === '1-0'
                      ? 'text-emerald-400'
                      : game.result === '0-1'
                        ? 'text-rose-400'
                        : 'text-zinc-300')
                  }
                >
                  {game.result}
                </span>
              </p>
            </div>

            <button
              onClick={copyPgn}
              className="btn-press shrink-0 px-2.5 sm:px-3 py-1.5 text-xs bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition active:scale-95"
              title="Copy PGN"
            >
              {copied ? '✓' : 'PGN'}
            </button>
          </div>
        </div>

        {/* Move list - takes remaining height */}
        <div className="flex-1 overflow-y-auto move-list glass rounded-xl p-2.5 sm:p-3.5 min-h-[140px] sm:min-h-0">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-1.5 sm:gap-x-2 gap-y-0.5 text-sm font-mono">
            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => {
              const whiteMove = history[i * 2]
              const blackMove = history[i * 2 + 1]
              const whiteIdx = i * 2 + 1
              const blackIdx = i * 2 + 2
              return (
                <div key={i} className="contents">
                  <span className="text-zinc-600 text-right pr-0.5 sm:pr-1 select-none text-xs sm:text-sm">
                    {i + 1}.
                  </span>
                  <button
                    onClick={() => goToMove(whiteIdx)}
                    className={
                      'text-left px-1 sm:px-1.5 py-0.5 rounded transition active:scale-95 ' +
                      (moveIndex === whiteIdx ? 'move-active' : 'hover:bg-zinc-800/80 text-zinc-200')
                    }
                  >
                    {whiteMove}
                  </button>
                  {blackMove ? (
                    <button
                      onClick={() => goToMove(blackIdx)}
                      className={
                        'text-left px-1 sm:px-1.5 py-0.5 rounded transition active:scale-95 ' +
                        (moveIndex === blackIdx ? 'move-active' : 'hover:bg-zinc-800/80 text-zinc-200')
                      }
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
