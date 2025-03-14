"use client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null); // 清空错误信息
    if (!username || !password) {
      setError("请填写用户名和密码");
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
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

  const handleLogin = async () => {
    setError(null); // 清空错误信息
    if (!username || !password) {
      setError("请填写用户名和密码");
      return;
    }

    try {
      const res = await fetch(
        `/api/auth?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        { method: "GET" }
      );
      const data = await res.json();
      if (data.success) {
        setUserId(data.userId);
        setIsLoggedIn(true);
        // 存储 userId 和登录状态（临时使用 localStorage，推荐使用 next-auth）
        localStorage.setItem("userId", data.userId.toString());
        localStorage.setItem("isLoggedIn", "true");
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
    localStorage.removeItem("userId");
    localStorage.removeItem("isLoggedIn");
    alert("已登出");
  };

  // 检查是否已登录（页面加载时）
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedIsLoggedIn = localStorage.getItem("isLoggedIn");
    if (storedUserId && storedIsLoggedIn === "true") {
      setUserId(parseInt(storedUserId, 10));
      setIsLoggedIn(true);
    }
  }, []);

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