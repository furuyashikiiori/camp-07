import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>ここがホーム</h1>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h2>機能1とか</h2>
          </div>
          <div className={styles.feature}>
            <h2>機能2とか</h2>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
