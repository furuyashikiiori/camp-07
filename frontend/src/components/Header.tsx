import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.navLinks}>
          <Link href='/' className={styles.navLink}>
            ホーム
          </Link>
          <Link href='/mypage' className={styles.navLink}>
            マイページ
          </Link>
          <Link href='/qrpage' className={styles.navLink}>
            QRコード
          </Link>
        </div>
      </nav>
    </header>
  );
}
