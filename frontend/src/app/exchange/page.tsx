"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { getUser, authenticatedFetch } from "@/utils/auth";

type Profile = {
  id: number;
  user_id: number;
  display_name: string;
  title: string;
  description?: string;
};

function ExchangePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scannedProfileId = searchParams.get("profileId");

  const [myProfiles, setMyProfiles] = useState<Profile[]>([]);
  const [scannedProfile, setScannedProfile] = useState<Profile | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 既存のコネクションIDを保存する状態を追加
  const [existingConnectionId, setExistingConnectionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (!scannedProfileId) {
        setError("プロフィールIDが指定されていません");
        setLoading(false);
        return;
      }

      try {
        // 自分のプロフィール一覧を取得
        const myProfilesResponse = await authenticatedFetch(
          `/api/users/${user.id}/profiles`
        );
        if (!myProfilesResponse.ok) {
          throw new Error("プロフィールの取得に失敗しました");
        }
        const myProfilesData = await myProfilesResponse.json();
        const profiles = myProfilesData.profiles || [];
        setMyProfiles(profiles);

        // 相手のプロフィール情報を取得
        const scannedProfileResponse = await authenticatedFetch(
          `/api/profiles/${scannedProfileId}`
        );
        if (!scannedProfileResponse.ok) {
          throw new Error("相手のプロフィール情報の取得に失敗しました");
        }
        const scannedProfileData = await scannedProfileResponse.json();
        setScannedProfile(scannedProfileData);

        // 最初のプロフィールをデフォルトで選択
        if (profiles.length > 0) {
          const firstProfileId = profiles[0].id;
          setSelectedProfileId(firstProfileId);
          
          // 既存のコネクション情報を確認
          if (scannedProfileData.id) {
            try {
              const connectionsResponse = await authenticatedFetch(
                `/api/connections?profile_id=${firstProfileId}`
              );
              
              if (connectionsResponse.ok) {
                const connectionsData = await connectionsResponse.json();              // 表示中のプロフィールとのコネクションを検索
              const existingConnection = connectionsData.connections?.find(
                (conn: { connect_user_profile_id: number }) => conn.connect_user_profile_id === scannedProfileData.id
              );
                
                if (existingConnection) {
                  // 既存のコネクション情報をフォームに設定
                  setEventInfo({
                    eventName: existingConnection.event_name || "",
                    eventDate: existingConnection.event_date || "",
                    memo: existingConnection.memo || ""
                  });
                  setExistingConnectionId(existingConnection.id);
                }
              }
            } catch (err) {
              console.error("コネクション情報取得エラー:", err);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, scannedProfileId]);

  // イベント情報の状態
  const [eventInfo, setEventInfo] = useState({
    eventName: "",
    eventDate: "",
    memo: "",
  });

  const handleExchange = async () => {
    if (!selectedProfileId || !scannedProfile) return;

    setExchanging(true);
    setError(null);

    try {
      let response;
      
      // 既存のコネクションがある場合は更新、そうでなければ新規作成
      if (existingConnectionId) {
        // 既存のコネクションを更新
        response = await authenticatedFetch(`/api/connections/${existingConnectionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_name: eventInfo.eventName,
            event_date: eventInfo.eventDate,
            memo: eventInfo.memo,
          }),
        });
        
        if (!response.ok) {
          throw new Error('フレンド情報の更新に失敗しました');
        }
      } else {
        // 新規作成の場合は両方向のコネクションを作成
        const response1 = await authenticatedFetch('/api/connections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: selectedProfileId,
            connect_user_profile_id: scannedProfile.id,
            event_name: eventInfo.eventName,
            event_date: eventInfo.eventDate,
            memo: eventInfo.memo
          }),
        });

        const response2 = await authenticatedFetch('/api/connections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: scannedProfile.id,
            connect_user_profile_id: selectedProfileId,
            event_name: eventInfo.eventName,
            event_date: eventInfo.eventDate,
            memo: eventInfo.memo
          }),
        });

        if (!response1.ok || !response2.ok) {
          throw new Error('プロフィール交換に失敗しました');
        }
        
        // 新規作成後に接続IDを取得して状態を更新
        if (response1.ok) {
          const data = await response1.json();
          if (data?.connection?.id) {
            setExistingConnectionId(data.connection.id);
          }
        }
      }

      // 成功した場合、完了ページに遷移または元のページに戻る
      router.push("/qrpage?exchanged=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setExchanging(false);
    }
  };

  // プロフィール選択時に既存のコネクションを確認
  const handleProfileSelect = async (profileId: number) => {
    setSelectedProfileId(profileId);
    
    if (!scannedProfile) return;
    
    try {
      const connectionsResponse = await authenticatedFetch(
        `/api/connections?profile_id=${profileId}`
      );
      
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        // 表示中のプロフィールとのコネクションを検索
        const existingConnection = connectionsData.connections?.find(
          (conn: { connect_user_profile_id: number }) => conn.connect_user_profile_id === scannedProfile.id
        );
        
        if (existingConnection) {
          // 既存のコネクション情報をフォームに設定
          setEventInfo({
            eventName: existingConnection.event_name || "",
            eventDate: existingConnection.event_date || "",
            memo: existingConnection.memo || ""
          });
          setExistingConnectionId(existingConnection.id);
        } else {
          // 新規作成の場合はフォームをリセット
          setEventInfo({
            eventName: '',
            eventDate: '',
            memo: ''
          });
          setExistingConnectionId(null);
        }
      }
    } catch (err) {
      console.error("コネクション情報取得エラー:", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <p>読み込み中...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <Link href='/qrpage' className={styles.backLink}>
            &lt; QRページに戻る
          </Link>
          <h1 className={styles.title}>エラー</h1>
          <p className={styles.error}>{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Link href='/qrpage' className={styles.backLink}>
          &lt; QRページに戻る
        </Link>

        <h1 className={styles.title}>{existingConnectionId ? 'フレンド情報編集' : 'プロフィール交換'}</h1>

        <div className={styles.exchangeSection}>
          <div className={styles.profileSection}>
            <h2>相手のプロフィール</h2>
            {scannedProfile && (
              <div className={styles.profileCard}>
                <h3>{scannedProfile.title}</h3>
                <p>
                  <strong>表示名:</strong> {scannedProfile.display_name}
                </p>
                {scannedProfile.description && (
                  <p>
                    <strong>説明:</strong> {scannedProfile.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={styles.profileSection}>
            <h2>交換するあなたのプロフィールを選択</h2>
            {myProfiles.length === 0 ? (
              <p>プロフィールがありません。</p>
            ) : (
              <div className={styles.profileSelection}>
                {myProfiles.map((profile) => (
                  <div key={profile.id} className={styles.profileOption}>
                    <input
                      type='radio'
                      id={`profile-${profile.id}`}
                      name='selectedProfile'
                      value={profile.id}
                      checked={selectedProfileId === profile.id}

                      onChange={(e) => handleProfileSelect(Number(e.target.value))}
                    />
                    <label
                      htmlFor={`profile-${profile.id}`}
                      className={styles.profileLabel}
                    >
                      <div className={styles.profileCard}>
                        <h3>{profile.title}</h3>
                        <p>
                          <strong>表示名:</strong> {profile.display_name}
                        </p>
                        {profile.description && (
                          <p>
                            <strong>説明:</strong> {profile.description}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* イベント情報入力セクション */}
        <div className={styles.eventInfoSection}>
          <h2>イベント情報（任意）</h2>

          <div className={styles.formGroup}>
            <label htmlFor='eventName'>イベント名:</label>
            <input
              type='text'
              id='eventName'
              value={eventInfo.eventName}
              onChange={(e) =>
                setEventInfo((prev) => ({ ...prev, eventName: e.target.value }))
              }
              placeholder='例: 技術交流会'
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='eventDate'>イベント日付:</label>
            <input
              type='date'
              id='eventDate'
              value={eventInfo.eventDate}
              onChange={(e) =>
                setEventInfo((prev) => ({ ...prev, eventDate: e.target.value }))
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='memo'>メモ:</label>
            <textarea
              id='memo'
              value={eventInfo.memo}
              onChange={(e) =>
                setEventInfo((prev) => ({ ...prev, memo: e.target.value }))
              }
              placeholder='例: エンジニアのAさん'
              rows={3}
            />
          </div>
        </div>

        <div className={styles.exchangeAction}>
          <button
            onClick={handleExchange}
            disabled={!selectedProfileId || exchanging}
            className={styles.exchangeButton}
          >

            {exchanging ? '処理中...' : existingConnectionId ? 'フレンド情報を更新する' : 'フレンド情報を登録する'}

          </button>
        </div>
      </main>
    </div>
  );
}

export default function ExchangePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExchangePageContent />
    </Suspense>
  );
}
