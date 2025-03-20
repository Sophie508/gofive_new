"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import styles from "./game.module.css";
import useSWR, { mutate } from 'swr';
import { useIsClient } from 'foxact/use-is-client';

// Square and Board components
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
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient(); // 使用 useIsClient 替换 mounted
  const [userId, setUserId] = useState<number>(0);

  const mode = searchParams.get("mode") || "human";
  const [boardSize] = useState(15);
  const [history, setHistory] = useState([Array(boardSize * boardSize).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [time, setTime] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const [isAIThinking, setIsAIThinking] = useState(false);

  // 在客户端加载 userId
  useEffect(() => {
    if (isClient) {
      const cookieUserId = document.cookie
        .split("; ")
        .find(row => row.startsWith("userId="))
        ?.split("=")[1];
      setUserId(parseInt(cookieUserId || "0"));
    }
  }, [isClient]);

  useEffect(() => {
    const interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function handlePlay(nextSquares: string[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  useEffect(() => {
    if (isClient && mode === "ai" && !xIsNext && !calculateWinner(currentSquares)) {
      setIsAIThinking(true);
      const delay = Math.floor(Math.random() * 1000) + 500;
      const timer = setTimeout(() => {
        const aiMove = getAIMove(currentSquares, boardSize);
        handleClick(aiMove);
        setIsAIThinking(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [currentMove, mode, isClient]);

  function handleClick(i: number) {
    if (calculateWinner(currentSquares) || currentSquares[i] || isAIThinking) return;
    const nextSquares = currentSquares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    handlePlay(nextSquares);
  }

  const resetGame = () => {
    setHistory([Array(boardSize * boardSize).fill(null)]);
    setCurrentMove(0);
    setTime(0);
  };

  const goBackHome = () => {
    router.push("/");
  };

  const saveScore = async () => {
    if (!userId || userId === 0) {
      alert("请先登录");
      return;
    }
    try {
      const res = await fetch("/api/scoreboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, steps: currentMove, time }),
      });
      const data = await res.json();
      if (data.success) {
        alert("分数已自动保存");
        mutate("/api/scoreboard", data, false);
      } else {
        alert("保存分数失败");
      }
    } catch (err) {
      alert("保存分数时出错");
    }
  };

  const winner = calculateWinner(currentSquares);
  useEffect(() => {
    if (winner && userId) {
      saveScore();
    }
  }, [winner, userId]);

  const status = winner
    ? `Winner: ${winner}`
    : `Next Player: ${xIsNext ? "X" : "O"}`;

  if (!isClient) {
    return null;
  }

  return (
    <div className={`${styles.game} ${theme === "dark" ? styles.dark : styles.light}`}>
      <div className={styles.header}>
        <h1>The Game is beginning</h1>
        <div>Mode: {mode === "ai" ? "Human vs AI" : "Human vs Human"}</div>
      </div>
      <div className={styles.status}>{status}</div>
      <div>Steps: {currentMove}, Time: {time} seconds</div>

      <div className={styles.gameContainer}>
        <button className={styles.leftButton} onClick={goBackHome}>
          Go back home
        </button>
        <div className={styles.boardWrapper}>
          <Board
            boardSize={boardSize}
            xIsNext={xIsNext}
            squares={currentSquares}
            onPlay={handlePlay}
            mode={mode}
            disabled={isAIThinking}
          />
        </div>
        <button className={styles.rightButton} onClick={resetGame}>
          Reset the game
        </button>
      </div>

      <button
        className={styles.themeToggle}
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        Toggle {theme === "light" ? "Dark" : "Light"} Mode
      </button>
    </div>
  );
}

// calculateWinner, getAIMove, checkThreeInARow functions
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
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      const newSquares = squares.slice();
      newSquares[i] = "O";
      if (calculateWinner(newSquares) === "O") {
        return i;
      }
    }
  }

  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      const newSquares = squares.slice();
      newSquares[i] = "X";
      if (calculateWinner(newSquares) === "X") {
        return i;
      }
    }
  }

  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) {
      if (checkThreeInARow(squares, boardSize, i, "X")) {
        return i;
      }
    }
  }

  const center = Math.floor((boardSize * boardSize) / 2);
  if (squares[center] === null) {
    return center;
  }

  const emptySquares = squares
    .map((val, idx) => (val === null ? idx : null))
    .filter((val) => val !== null);
  return emptySquares[Math.floor(Math.random() * emptySquares.length)] || 0;
}

function checkThreeInARow(squares: string[], boardSize: number, position: number, player: string) {
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