"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./game.module.css";

function Square({
  value,
  onSquareClick,
  disabled,
  xIsNext,
}: {
  value: string;
  onSquareClick: () => void;
  disabled: boolean;
  xIsNext: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`${styles.square} ${
        isHovered && !value && !disabled ? styles.hover : ""
      }`}
      onClick={onSquareClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-preview={!value && isHovered ? (xIsNext ? "X" : "O") : ""}
    >
      {value}
    </button>
  );
}

function Board({
  boardSize,
  xIsNext,
  squares,
  onPlay,
  mode,
  disabled,
}: {
  boardSize: number;
  xIsNext: boolean;
  squares: string[];
  onPlay: (nextSquares: string[]) => void;
  mode: string;
  disabled: boolean;
}) {
  function handleClick(i: number) {
    if (calculateWinner(squares) || squares[i]) return;
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    onPlay(nextSquares);
  }

  const board = Array(boardSize)
    .fill(null)
    .map((_, row) => (
      <div key={row} className={styles.boardRow}>
        {Array(boardSize)
          .fill(null)
          .map((_, col) => {
            const index = row * boardSize + col;
            return (
              <Square
                key={index}
                value={squares[index]}
                onSquareClick={() => handleClick(index)}
                disabled={disabled}
                xIsNext={xIsNext}
              />
            );
          })}
      </div>
    ));

  return <div className={styles.board}>{board}</div>;
}

export default function Game() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") || "human";
  const [boardSize] = useState(15);
  const [history, setHistory] = useState([
    Array(boardSize * boardSize).fill(null),
  ]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(prefersDark.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    prefersDark.addEventListener("change", handler);
    return () => prefersDark.removeEventListener("change", handler);
  }, []);

  function handlePlay(nextSquares: string[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  useEffect(() => {
    if (mode === "ai" && !xIsNext && !calculateWinner(currentSquares)) {
      setIsAIThinking(true);
      const delay = Math.floor(Math.random() * 1000) + 500;
      const timer = setTimeout(() => {
        const aiMove = getAIMove(currentSquares, boardSize);
        handleClick(aiMove);
        setIsAIThinking(false);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentMove, mode]);

  function handleClick(i: number) {
    if (calculateWinner(currentSquares) || currentSquares[i] || isAIThinking)
      return;
    const nextSquares = currentSquares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    handlePlay(nextSquares);
  }

  const resetGame = () => {
    setHistory([Array(boardSize * boardSize).fill(null)]);
    setCurrentMove(0);
  };

  const goBackHome = () => {
    router.push("/");
  };

  const winner = calculateWinner(currentSquares);
  const status = winner
    ? `Winner: ${winner}`
    : `Next Player: ${xIsNext ? "X" : "O"}`;

  return (
    <div className={`${styles.game} ${isDarkMode ? styles.darkMode : ""}`}>
      <h1>The Game is beginning</h1>
      <div>Mode: {mode === "ai" ? "Human vs AI" : "Human vs Human"}</div>
      <div className={styles.status}>{status}</div>

      <div className={styles.gameContainer}>
        <button onClick={goBackHome} className={styles.leftButton}>
          Go back home
        </button>

        <Board
          boardSize={boardSize}
          xIsNext={xIsNext}
          squares={currentSquares}
          onPlay={handlePlay}
          mode={mode}
          disabled={isAIThinking}
        />

        <button onClick={resetGame} className={styles.rightButton}>
          Reset the game
        </button>
      </div>

      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={styles.themeToggle}
      >
        Toggle {isDarkMode ? "Light" : "Dark"} Mode
      </button>
    </div>
  );
}

function calculateWinner(squares: string[]) {
  const boardSize = Math.sqrt(squares.length);
  const directions = [
    [1, 0], // 水平
    [0, 1], // 垂直
    [1, 1], // 对角线
    [1, -1], // 对角线
  ];

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const index = row * boardSize + col;
      const current = squares[index];
      if (!current) continue;

      for (const [dx, dy] of directions) {
        let count = 1;
        let x = row + dx;
        let y = col + dy;

        while (
          x >= 0 &&
          x < boardSize &&
          y >= 0 &&
          y < boardSize &&
          squares[x * boardSize + y] === current
        ) {
          count++;
          x += dx;
          y += dy;
        }

        if (count >= 5) return current;
      }
    }
  }
  return null;
}

function getAIMove(squares: string[], boardSize: number) {
  // 1. 检查 AI 是否有 4 颗子连成一线（进攻）
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      const newSquares = squares.slice();
      newSquares[i] = "O";
      if (calculateWinner(newSquares) === "O") {
        return i; // AI 直接赢
      }
    }
  }

  // 玩家是否有 4 颗子连成一线（防守）
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      const newSquares = squares.slice();
      newSquares[i] = "X";
      if (calculateWinner(newSquares) === "X") {
        return i; // 堵住玩家的胜利位置
      }
    }
  }

  // 检查human是否有 3 颗子连成一线
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      if (checkThreeInARow(squares, boardSize, i, "X")) {
        return i; // 堵住玩家的 3 连
      }
    }
  }

  // 占据中心位置
  const center = Math.floor((boardSize * boardSize) / 2);
  if (squares[center] === null) {
    return center;
  }

  // otherwise-随机选择一个空位
  const emptySquares = squares
    .map((val, idx) => (val === null ? idx : null))
    .filter((val) => val !== null);
  return emptySquares[Math.floor(Math.random() * emptySquares.length)] || 0;
}

// check-某个位置是否会形成 3 连
function checkThreeInARow(
  squares: string[],
  boardSize: number,
  position: number,
  player: string
) {
  const directions = [
    [1, 0], // 水平
    [0, 1], // 垂直
    [1, 1], // 对角线
    [1, -1], // 对角线
  ];

  const row = Math.floor(position / boardSize);
  const col = position % boardSize;
  const tempSquares = squares.slice();
  tempSquares[position] = player;

  for (const [dx, dy] of directions) {
    let count = 1;

    // 检查正方向
    let x = row + dx;
    let y = col + dy;
    while (
      x >= 0 &&
      x < boardSize &&
      y >= 0 &&
      y < boardSize &&
      tempSquares[x * boardSize + y] === player
    ) {
      count++;
      x += dx;
      y += dy;
    }

    // 检查另一个方向
    x = row - dx;
    y = col - dy;
    while (
      x >= 0 &&
      x < boardSize &&
      y >= 0 &&
      y < boardSize &&
      tempSquares[x * boardSize + y] === player
    ) {
      count++;
      x -= dx;
      y -= dy;
    }

    if (count >= 3) return true;
  }
  return false;
}
