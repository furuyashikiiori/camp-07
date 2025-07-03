import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.footerText}>&copy; 2025 ここはフッター</p>
      </div>
    </footer>
  );
}
