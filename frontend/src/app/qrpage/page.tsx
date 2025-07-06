import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";
import QRGenerator from "./components/QRGenerator";

export default function qrPage() {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>QRコードページ</h1>
        <QRGenerator />
        <p>このQRコードをスキャンして、特定の情報にアクセスできます。</p>
        <p>
          localhost:3000/mypagenoのURLをQRコードにして表示してる状態
        </p>
      </main>
      <Footer />
    </div>
  );
}
