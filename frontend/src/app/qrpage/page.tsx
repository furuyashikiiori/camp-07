'use client';

import { useState } from 'react';
import QRGenerator from "./components/QRGenerator";
import Link from 'next/link';
import styles from "./page.module.css";

export default function QRPage() {
  const [selectedProfile, setSelectedProfile] = useState('business');

  const dummyProfiles = [
    { id: 'business', name: 'ビジネス用' },
    { id: 'casual', name: 'カジュアル用' },
    { id: 'sns', name: 'SNS用' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProfile(e.target.value);
  };

  const handleScanClick = () => {
    alert('QRコードの読み取り機能は未実装です');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          &lt; Back StartPage
        </Link>

        <h1 className={styles.title}>QRコードページ</h1>

        <div className={styles.card}>
          <label htmlFor="profileSelect" className={styles.selectLabel}>
            表示するプロフィールを選択：
          </label>
          <select
            id="profileSelect"
            value={selectedProfile}
            onChange={handleChange}
            className={styles.select}
          >
            {dummyProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>

          <QRGenerator />

          <p className={styles.paragraph}>選択中のプロフィールID: {selectedProfile}</p>

          <button className={styles.scanButton} onClick={handleScanClick}>
            QRコードを読み取る
          </button>
        </div>
      </main>
    </div>
  );
}


// 'use client';

// import QRGenerator from "./components/QRGenerator";
// import Link from 'next/link';
// import styles from "./page.module.css";

// export default function QRPage() {
//   return (
//     <div className={styles.container}>
//       <main className={styles.main}>
//         <Link href="/" className={styles.backLink}>
//           &lt; Back StartPage
//         </Link>

//         <h1 className={styles.title}>QRコードページ</h1>

//         <div className={styles.card}>
//           <QRGenerator />
//           <p className={styles.paragraph}>このQRコードをスキャンして、特定の情報にアクセスできます。</p>
//           <p className={styles.paragraph}>localhost:3000/mypagenoのURLをQRコードにして表示してる状態</p>
//         </div>
//       </main>
//     </div>
//   );
// }
