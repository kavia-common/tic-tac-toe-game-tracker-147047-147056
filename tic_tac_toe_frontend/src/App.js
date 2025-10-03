import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';

/**
 * Game constants and helpers
 */
const COLORS = {
  primary: '#2563EB', // blue
  secondary: '#F59E0B', // amber
  success: '#10B981',
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  textMuted: '#6B7280',
};

const initialBoard = () => Array(9).fill(null);
const LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diags
];

function calculateWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every(Boolean)) return { winner: 'draw', line: [] };
  return { winner: null, line: [] };
}

function availableMoves(board) {
  return board.map((v, i) => (v ? null : i)).filter(v => v !== null);
}

/**
 * Simple AI using a mix of optimal checks and heuristics.
 * 1) Win if possible
 * 2) Block opponent
 * 3) Take center
 * 4) Take a corner
 * 5) Take a side
 */
function computeAIMove(board, ai = 'O', human = 'X') {
  const moves = availableMoves(board);
  // Win if possible
  for (const move of moves) {
    const copy = [...board];
    copy[move] = ai;
    if (calculateWinner(copy).winner === ai) return move;
  }
  // Block human win
  for (const move of moves) {
    const copy = [...board];
    copy[move] = human;
    if (calculateWinner(copy).winner === human) return move;
  }
  // Center
  if (board[4] === null) return 4;
  // Corners
  const corners = [0, 2, 6, 8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Sides
  const sides = [1, 3, 5, 7].filter(i => board[i] === null);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
  // Fallback
  return moves.length ? moves[0] : null;
}

/**
 * UI Components
 */

// ScoreBadge
function ScoreBadge({ label, value, color }) {
  return (
    <div
      className="score-badge"
      style={{
        background: `linear-gradient(135deg, ${color}22, #ffffff)`,
        border: `1px solid ${color}33`,
        color: COLORS.text,
      }}
      aria-label={`${label}: ${value}`}
    >
      <span className="score-label">{label}</span>
      <span className="score-value" style={{ color }}>{value}</span>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Game state
   */
  const [board, setBoard] = useState(initialBoard);
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('pvc'); // 'pvc' or 'pvp'
  const [scores, setScores] = useState({ x: 0, o: 0, draws: 0 });
  const [theme] = useState('light');
  const [aiThinking, setAiThinking] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const status = useMemo(() => {
    const { winner } = calculateWinner(board);
    if (winner === 'draw') return "It's a draw!";
    if (winner === 'X') return 'Player X wins!';
    if (winner === 'O') return 'Player O wins!';
    return `Turn: ${xIsNext ? 'X' : 'O'}`;
  }, [board, xIsNext]);

  // Handle endgame and scoring
  useEffect(() => {
    const { winner } = calculateWinner(board);
    if (!winner) return;

    setTimeout(() => {
      setScores(prev => {
        if (winner === 'X') return { ...prev, x: prev.x + 1 };
        if (winner === 'O') return { ...prev, o: prev.o + 1 };
        return { ...prev, draws: prev.draws + 1 };
      });
    }, 150);

  }, [board]);

  // AI Move if in pvc mode
  useEffect(() => {
    const { winner } = calculateWinner(board);
    if (mode !== 'pvc' || winner || xIsNext) return;
    setAiThinking(true);
    const timer = setTimeout(() => {
      const move = computeAIMove(board, 'O', 'X');
      if (move !== null) {
        setBoard(prev => {
          const copy = [...prev];
          copy[move] = 'O';
          return copy;
        });
        setXIsNext(true);
      }
      setAiThinking(false);
    }, 450); // slight delay for UX
    return () => clearTimeout(timer);
  }, [board, mode, xIsNext]);

  function handleSquareClick(i) {
    const { winner } = calculateWinner(board);
    if (winner || board[i] || (mode === 'pvc' && aiThinking)) return;
    setBoard(prev => {
      const copy = [...prev];
      copy[i] = xIsNext ? 'X' : 'O';
      return copy;
    });
    setXIsNext(prev => !prev);
  }

  function resetBoard() {
    setBoard(initialBoard());
    setXIsNext(true);
    setAiThinking(false);
  }

  function newMatch() {
    resetBoard();
  }

  function resetScores() {
    setScores({ x: 0, o: 0, draws: 0 });
    resetBoard();
  }

  const { winner, line } = calculateWinner(board);

  return (
    <div
      className="App"
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${COLORS.primary}0D 0%, ${COLORS.background} 40%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.text,
        padding: '24px',
      }}
    >
      <div
        className="container"
        style={{
          width: '100%',
          maxWidth: 920,
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          gap: 16,
        }}
      >
        {/* Header */}
        <header
          style={{
            background: COLORS.surface,
            borderRadius: 16,
            padding: '16px 20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            border: `1px solid ${COLORS.primary}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                letterSpacing: 0.2,
                color: COLORS.text,
              }}
            >
              Tic Tac Toe
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
              Ocean Professional — clean, minimal, responsive
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <ModeSwitch mode={mode} onChange={(m) => { setMode(m); newMatch(); }} />
          </div>
        </header>

        {/* Score Panel */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
          aria-label="Score panel"
        >
          <ScoreBadge label="Player X" value={scores.x} color={COLORS.primary} />
          <ScoreBadge label="Draws" value={scores.draws} color={COLORS.secondary} />
          <ScoreBadge label={mode === 'pvc' ? 'Computer (O)' : 'Player O'} value={scores.o} color={COLORS.primary} />
        </section>

        {/* Game and Side Panel */}
        <main
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 16,
          }}
        >
          <div
            className="game-card"
            style={{
              background: COLORS.surface,
              borderRadius: 16,
              padding: 20,
              border: `1px solid ${COLORS.primary}14`,
              boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color:
                    winner === 'X'
                      ? COLORS.primary
                      : winner === 'O'
                      ? COLORS.secondary
                      : COLORS.text,
                }}
                aria-live="polite"
              >
                {status} {aiThinking && mode === 'pvc' ? ' · AI thinking…' : ''}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <SoftButton
                  onClick={newMatch}
                  label="New Round"
                  color={COLORS.primary}
                />
                <SoftButton
                  onClick={resetScores}
                  label="Reset Scores"
                  color={COLORS.secondary}
                />
              </div>
            </div>

            <Board
              board={board}
              onClick={handleSquareClick}
              winningLine={line}
              disabled={Boolean(winner) || (mode === 'pvc' && !xIsNext) || aiThinking}
              primary={COLORS.primary}
              secondary={COLORS.secondary}
            />
          </div>
        </main>

        {/* Controls */}
        <footer
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Tag
            color={xIsNext ? COLORS.primary : COLORS.textMuted}
            label="X"
            active={xIsNext}
          />
          <div style={{ color: COLORS.textMuted, fontSize: 12 }}>vs</div>
          <Tag
            color={!xIsNext ? COLORS.secondary : COLORS.textMuted}
            label={mode === 'pvc' ? 'Computer (O)' : 'O'}
            active={!xIsNext}
          />
        </footer>
      </div>
    </div>
  );
}

/**
 * Components: ModeSwitch, SoftButton, Tag, Board, Square
 */
function ModeSwitch({ mode, onChange }) {
  return (
    <div
      role="group"
      aria-label="Mode switch"
      style={{
        background: '#ffffff',
        border: `1px solid ${COLORS.primary}22`,
        borderRadius: 999,
        padding: 4,
        display: 'flex',
        gap: 4,
      }}
    >
      <TogglePill
        active={mode === 'pvc'}
        onClick={() => onChange('pvc')}
        label="Player vs Computer"
        accent={COLORS.primary}
      />
      <TogglePill
        active={mode === 'pvp'}
        onClick={() => onChange('pvp')}
        label="Player vs Player"
        accent={COLORS.secondary}
      />
    </div>
  );
}

function TogglePill({ active, onClick, label, accent }) {
  return (
    <button
      onClick={onClick}
      className="toggle-pill"
      style={{
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        padding: '8px 14px',
        borderRadius: 999,
        background: active
          ? `linear-gradient(135deg, ${accent}22, #ffffff)`
          : 'transparent',
        color: active ? COLORS.text : COLORS.textMuted,
        boxShadow: active ? `inset 0 0 0 1px ${accent}33` : 'none',
        transition: 'all .25s ease',
        fontSize: 13,
        fontWeight: 600,
      }}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function SoftButton({ onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      className="soft-button"
      style={{
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        padding: '10px 14px',
        borderRadius: 12,
        background: `linear-gradient(135deg, ${color}22, #ffffff)`,
        color: COLORS.text,
        fontSize: 13,
        fontWeight: 600,
        transition: 'transform .15s ease, box-shadow .2s ease',
        boxShadow: `0 6px 16px ${color}22, inset 0 0 0 1px ${color}33`,
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px)'}
      onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {label}
    </button>
  );
}

function Tag({ label, color, active }) {
  return (
    <div
      className="tag"
      style={{
        padding: '8px 12px',
        borderRadius: 999,
        background: active ? `${color}15` : '#ffffff',
        color: active ? color : COLORS.textMuted,
        border: `1px solid ${active ? `${color}40` : '#E5E7EB'}`,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}
      aria-label={`Current ${label}`}
    >
      {label}
    </div>
  );
}

function Board({ board, onClick, winningLine, disabled, primary, secondary }) {
  return (
    <div
      className="board"
      role="grid"
      aria-label="Tic Tac Toe board"
      style={{
        width: '100%',
        maxWidth: 460,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
      }}
    >
      {board.map((value, i) => {
        const isWinning = winningLine.includes(i);
        return (
          <Square
            key={i}
            value={value}
            onClick={() => onClick(i)}
            disabled={disabled || Boolean(value)}
            highlight={isWinning}
            primary={primary}
            secondary={secondary}
          />
        );
      })}
    </div>
  );
}

function Square({ value, onClick, disabled, highlight, primary, secondary }) {
  const accent = value === 'X' ? primary : value === 'O' ? secondary : COLORS.textMuted;
  return (
    <button
      onClick={onClick}
      className="square"
      disabled={disabled}
      style={{
        aspectRatio: '1 / 1',
        width: '100%',
        borderRadius: 16,
        border: `1px solid ${accent}33`,
        background: `linear-gradient(135deg, ${accent}10, #ffffff)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(32px, 6vw, 48px)',
        fontWeight: 800,
        color: value ? accent : COLORS.textMuted,
        boxShadow: highlight
          ? `0 12px 24px ${accent}33, inset 0 0 0 2px ${accent}66`
          : `0 10px 20px rgba(0,0,0,0.06)`,
        transition: 'transform .1s ease, box-shadow .2s ease, background .2s ease',
        cursor: disabled ? 'default' : 'pointer',
      }}
      aria-label={`Square ${value || 'empty'}`}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {value}
    </button>
  );
}

export default App;
