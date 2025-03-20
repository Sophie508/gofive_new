"use client";

import useSWR from 'swr';
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

interface Score {
  username: string;
  steps: number;
  time: number;
}

// 定义一个 fetcher 函数，用于处理 fetch 请求
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Scoreboard() {
  const router = useRouter();

  // 使用 useSWR 获取分数数据
  const { data: scores, error, isLoading } = useSWR<Score[]>("/api/scoreboard", fetcher);

  if (error) {
    console.error("Error fetching scores:", error);
    return <div>加载分数失败</div>;
  }

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>记分板</h1>
      {!scores || scores.length === 0 ? (
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