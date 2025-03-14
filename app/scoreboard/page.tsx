"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

interface Score {
  username: string;
  steps: number;
  time: number;
}

export default function Scoreboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch("/api/scoreboard");
        if (!res.ok) {
          throw new Error("Failed to fetch scores");
        }
        const data: Score[] = await res.json();
        setScores(data);
      } catch (error) {
        console.error("Error fetching scores:", error);
        setScores([]); // 如果请求失败，设置为空数组
      }
    };

    fetchScores();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>记分板</h1>
      {scores.length === 0 ? (
        <p>暂无记录</p>
      ) : (
        scores.map((score, index) => (
          <div key={index} style={{ margin: "10px 0" }}>
            {index + 1}. {score.username}: {score.steps} 步, {score.time} 秒
          </div>
        ))
      )}
      <button onClick={() => router.push("/")} className={styles.button}>
        返回首页
      </button>
    </div>
  );
}