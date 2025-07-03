import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function QrPage() {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>QRコードページ</h1>
        <p>このQRコードをスキャンして、特定の情報にアクセスできます。</p>
      </main>
      <Footer />
    </div>
  );
}
