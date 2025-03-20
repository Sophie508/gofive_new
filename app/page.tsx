"use client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useLocalStorage } from 'foxact/use-local-storage'; // 引入 useLocalStorage

// - swr 的数据获取
const fetcher = (url: string, options?: RequestInit) =>
  fetch(url, options).then((res) => res.json());

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 使用 useLocalStorage 管理 userId 和 isLoggedIn
  const [userId, setUserId] = useLocalStorage<number | null>("userId", null);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>("isLoggedIn", false);

  // 使用 swr 处理注册请求
  const handleRegister = async () => {
    setError(null);
    if (!username || !password) {
      setError("请填写用户名和密码");
      return;
    }

    try {
      const data = await fetcher("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (data.success) {
        alert("注册成功，请登录");
        setUsername("");
        setPassword("");
      } else {
        setError(data.error || "注册失败");
      }
    } catch (err) {
      setError("注册失败，请稍后再试");
    }
  };

  // 使用 swr 处理登录请求
  const handleLogin = async () => {
    setError(null);
    if (!username || !password) {
      setError("请填写用户名和密码");
      return;
    }

    try {
      const data = await fetcher(
        `/api/auth?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        { method: "GET", credentials: "include" }
      );

      if (data.success) {
        setUserId(data.userId);
        setIsLoggedIn(true);
        alert("登录成功");
      } else {
        setError(data.error || "登录失败");
      }
    } catch (err) {
      setError("登录失败，请稍后再试");
    }
  };

  const startHumanVsHuman = () => {
    if (userId) {
      router.push(`/game?mode=human&userId=${userId}`);
    } else {
      setError("用户未登录，请重新登录");
    }
  };

  const startHumanVsAI = () => {
    if (userId) {
      router.push(`/game?mode=ai&userId=${userId}`);
    } else {
      setError("用户未登录，请重新登录");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    document.cookie = "userId=; path=/; max-age=0";
    document.cookie = "isLoggedIn=; path=/; max-age=0";
    alert("已登出");
  };

  useEffect(() => {
    if (userId && isLoggedIn) {
      document.cookie = `userId=${userId}; path=/; maxAge=86400`;
      document.cookie = `isLoggedIn=true; path=/; maxAge=86400`;
    }
  }, [userId, isLoggedIn]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to 五子棋小游戏</h1>
      {error && <p className={styles.error}>{error}</p>}
      {!isLoggedIn ? (
        <div className={styles.form}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名（3-50字符，仅字母数字）"
            className={styles.input}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（6-100字符）"
            className={styles.input}
            required
          />
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={handleRegister}>
              注册
            </button>
            <button className={styles.button} onClick={handleLogin}>
              登录
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.gameModes}>
          <p>Choose your game mode:</p>
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={startHumanVsHuman}>
              Human vs Human
            </button>
            <button className={styles.button} onClick={startHumanVsAI}>
              Human vs AI
            </button>
            <button
              className={styles.button}
              onClick={() => router.push("/scoreboard")}
            >
              查看记分板
            </button>
            <button className={styles.button} onClick={handleLogout}>
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
}