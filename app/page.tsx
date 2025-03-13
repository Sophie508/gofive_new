"use client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router: NextRouter = useRouter();

  const startHumanVsHuman = () => router.push("/game?mode=human");
  const startHumanVsAI = () => router.push("/game?mode=ai");

  return (
    <div className={styles.container}>
     <h1 className={styles.title}>Welcome to 五子棋</h1>
  <p>Choose your game mode:</p>
  <button className={styles.button} onClick={startHumanVsHuman}>
    Human vs Human
  </button>
  <button className={styles.button} onClick={startHumanVsAI}>
    Human vs AI
  </button>
</div>
  );
}