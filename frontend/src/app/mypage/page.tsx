import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function MyPage() {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>マイページ</h1>
        <div className={styles.profileSection}>
          <div className={styles.profileImage}>!?</div>
          <div className={styles.profileInfo}>
            <h3>ユーザープロフィール</h3>
            <p>
              <strong>名前:</strong> hoge
            </p>
            <p>
              <strong>メール:</strong> hoge
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
