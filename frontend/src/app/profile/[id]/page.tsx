"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Image from 'next/image';
import { authenticatedFetch, getUser } from "@/utils/auth";

declare module "next-auth" {
  interface User {
    id: string
  }
  
  interface Session {
    user: User & {
      id: string
    }
  }
}

type Profile = {
  id: number;
  user_id: number;
  display_name: string;
  icon_url?: string;
  aka?: string;
  hometown?: string;
  birthdate?: string;
  hobby?: string;
  comment?: string;
  title?: string;
  description?: string;
  option_profiles?: { label: string; value: string }[];
};

type OptionProfile = {
  id: number;
  title: string;
  content: string;
  profile_id: number;
};

type LinkItem = {
  id: number;
  user_id?: number;
  profile_id?: number;
  image_url?: string;
  title: string;
  description?: string;
  url: string;
  created_at: string;
  updated_at: string;
};

export default function ProfileDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [optionProfiles, setOptionProfiles] = useState<OptionProfile[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // プロフィール所有者かどうかを判定する状態
  const [isOwner, setIsOwner] = useState<boolean>(false);
  // フレンド追加・編集のための状態
  const [friendForm, setFriendForm] = useState<{
    isOpen: boolean;
    eventName: string;
    eventDate: string;
    memo: string;
    isSubmitting: boolean;
    existingConnectionId: number | null; // 既存のコネクションIDを保存
  }>({
    isOpen: false,
    eventName: "",
    eventDate: "",
    memo: "",
    isSubmitting: false,
    existingConnectionId: null,
  });
  const [addFriendResult, setAddFriendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, optionResponse] = await Promise.all([
          authenticatedFetch(`/api/profiles/${params.id}`),
          authenticatedFetch(`/api/profiles/${params.id}/option-profiles`),
        ]);

        if (!profileResponse.ok) {
          throw new Error("プロフィールの取得に失敗しました");
        }
        const profileData = await profileResponse.json();

        // アイコンURLが相対パスの場合、バックエンドの完全URLに変換
        if (profileData.icon_url && profileData.icon_url.startsWith("/api/")) {
          profileData.icon_url = `http://localhost:8080${profileData.icon_url}`;
        }

        setProfile(profileData);

        if (optionResponse.ok) {
          const optionData = await optionResponse.json();
          setOptionProfiles(optionData.option_profiles || []);
        } else {
          console.log("Option profiles response error:", optionResponse.status);
        }

        // ログインユーザーのプロフィール取得
        const user = getUser();
        
        // プロフィールの所有者かどうかを判定
        if (user && profileData.user_id === Number(user.id)) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
        if (user) {
          try {
            const userProfilesResponse = await authenticatedFetch(
              `/api/users/${user.id}/profiles`
            );
            if (userProfilesResponse.ok) {
              const userProfilesData = await userProfilesResponse.json();
              setUserProfiles(userProfilesData.profiles || []);
              // 最初のプロフィールをデフォルト選択
              if (userProfilesData.profiles && userProfilesData.profiles.length > 0) {
                const firstProfileId = userProfilesData.profiles[0].id;
                setSelectedProfileId(firstProfileId);
                
                // 既存のコネクション情報を取得 (自分のプロフィールでない場合のみ)
                if (!isOwner && profileData.id) {
                  try {
                    // 自分のプロフィールから相手のプロフィールへのコネクションを確認
                    const connectionsResponse = await authenticatedFetch(
                      `/api/connections?profile_id=${firstProfileId}`
                    );
                    
                    if (connectionsResponse.ok) {
                      const connectionsData = await connectionsResponse.json();
                      // 表示中のプロフィールとのコネクションを検索
                      const existingConnection = connectionsData.connections?.find(
                        (conn: any) => conn.connect_user_profile_id === profileData.id
                      );
                      
                      if (existingConnection) {
                        // 既存のコネクション情報をフォームに設定
                        setFriendForm(prev => ({
                          ...prev,
                          eventName: existingConnection.event_name || "",
                          eventDate: existingConnection.event_date || "",
                          memo: existingConnection.memo || "",
                          existingConnectionId: existingConnection.id
                        }));
                      } else {
                        // 相手のプロフィールから自分のプロフィールへのコネクションも確認
                        // (QRコード交換時に相手側が作成した可能性がある)
                        const reverseConnectionsResponse = await authenticatedFetch(
                          `/api/connections?profile_id=${profileData.id}`
                        );
                        
                        if (reverseConnectionsResponse.ok) {
                          const reverseConnectionsData = await reverseConnectionsResponse.json();
                          const reverseConnection = reverseConnectionsData.connections?.find(
                            (conn: any) => conn.connect_user_profile_id === firstProfileId
                          );
                          
                          if (reverseConnection) {
                            // 既存のコネクション情報をフォームに設定 (双方向のコネクションを考慮)
                            setFriendForm(prev => ({
                              ...prev,
                              eventName: reverseConnection.event_name || "",
                              eventDate: reverseConnection.event_date || "",
                              memo: reverseConnection.memo || "",
                              existingConnectionId: reverseConnection.id
                            }));
                          }
                        }
                      }
                    }
                  } catch (err) {
                    console.error("コネクション情報取得エラー:", err);
                  }
                }
              }
            }
          } catch (profilesError) {
            console.error("ユーザープロフィール取得エラー:", profilesError);
          }
        }

        // プロフィールのリンクを取得
        try {
          const linksResponse = await authenticatedFetch(
            `/api/links/profile/${params.id}`
          );
          if (linksResponse.ok) {
            const linksData = await linksResponse.json();
            // console.log("Links data:", linksData);
            setLinks(linksData.links || []);
          } else {
            console.log("Links response error:", linksResponse.status);
          }
        } catch (linkError) {
          console.error("リンクの取得でエラー:", linkError);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "不明なエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // フレンド追加・編集フォームの表示・非表示切り替え
  const toggleFriendForm = () => {
    setFriendForm((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      // フォームを閉じるときだけリセット、開くときは既存値を保持
      eventName: prev.isOpen ? "" : prev.eventName,
      eventDate: prev.isOpen ? "" : prev.eventDate, 
      memo: prev.isOpen ? "" : prev.memo,
    }));
    setAddFriendResult(null);
  };

  // フレンド追加・編集処理
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || !selectedProfileId) {
      setAddFriendResult({
        success: false,
        message: "プロフィールが選択されていません",
      });
      return;
    }

    setFriendForm((prev) => ({ ...prev, isSubmitting: true }));
    setAddFriendResult(null);

    try {
      let response;
      
      // 既存のコネクションが存在する場合は更新、そうでなければ新規作成
      if (friendForm.existingConnectionId) {
        // 既存のコネクションを更新
        response = await authenticatedFetch(`/api/connections/${friendForm.existingConnectionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_name: friendForm.eventName,
            event_date: friendForm.eventDate,
            memo: friendForm.memo,
          }),
        });
        
        if (!response.ok) {
          throw new Error("フレンド情報の更新に失敗しました");
        }
      } else {
        // 自分から相手へのコネクションを作成
        const myToFriendResponse = await authenticatedFetch("/api/connections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile_id: selectedProfileId,
            connect_user_profile_id: profile.id,
            event_name: friendForm.eventName,
            event_date: friendForm.eventDate,
            memo: friendForm.memo,
          }),
        });

        // 相手から自分へのコネクションを作成
        // （相互関係を作成する場合のみ）
        const friendToMyResponse = await authenticatedFetch("/api/connections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile_id: profile.id,
            connect_user_profile_id: selectedProfileId,
            event_name: friendForm.eventName,
            event_date: friendForm.eventDate,
            memo: friendForm.memo,
          }),
        });

        if (!myToFriendResponse.ok || !friendToMyResponse.ok) {
          throw new Error("フレンド追加に失敗しました");
        }
        
        // 新規作成後、IDを取得して状態を更新
        if (myToFriendResponse.ok) {
          const data = await myToFriendResponse.json();
          if (data?.connection?.id) {
            setFriendForm(prev => ({
              ...prev,
              existingConnectionId: data.connection.id
            }));
          }
        }
      }

      setAddFriendResult({
        success: true,
        message: friendForm.existingConnectionId 
          ? "フレンド情報を更新しました！" 
          : "フレンドを追加しました！",
      });

      // フォームを閉じる
      setFriendForm((prev) => ({
        ...prev,
        isOpen: false,
      }));

    } catch (err) {
      setAddFriendResult({
        success: false,
        message: err instanceof Error ? err.message : "エラーが発生しました",
      });
    } finally {
      setFriendForm((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // 関数を削除

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay}>
          <p className={styles.message}>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay}>
          <p className={styles.message}>
            {error || "プロフィールが見つかりませんでした。"}
          </p>
          <button className={styles.backButton} onClick={() => router.back()}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  const birthdayJP =
    profile.birthdate &&
    new Date(profile.birthdate).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <div className={styles.container}>
      <Link href='/' className={styles.backLink}>
        &lt; Back StartPage
      </Link>

      <div className={styles.overlay}>
        <div className={styles.profileHeader}>
          {profile.icon_url && (
            <div className={styles.iconContainer}>
              {/*<img
                src={profile.icon_url}
                alt={`${profile.display_name}のアイコン`}
                className={styles.profileIcon}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              /> */}
              <Image
                src={profile.icon_url}
                alt={`${profile.display_name}のアイコン`}
                className={styles.profileIcon}
                width={80}
                height={80}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
          <div className={styles.headerText}>
            <h1 className={styles.title}>{profile.display_name}</h1>
            {profile.title && (
              <p className={styles.subtitle}>{profile.title}</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          {profile.aka && (
            <div className={styles.row}>
              <span className={styles.label}>肩書き</span>
              <span className={styles.value}>{profile.aka}</span>
            </div>
          )}

          {profile.comment && (
            <div className={styles.row}>
              <span className={styles.label}>コメント</span>
              <span className={styles.value}>{profile.comment}</span>
            </div>
          )}

          {profile.description && (
            <div className={styles.row}>
              <span className={styles.label}>説明</span>
              <span className={styles.value}>{profile.description}</span>
            </div>
          )}

          {birthdayJP && (
            <div className={styles.row}>
              <span className={styles.label}>誕生日</span>
              <span className={styles.value}>{birthdayJP}</span>
            </div>
          )}

          {profile.hometown && (
            <div className={styles.row}>
              <span className={styles.label}>出身地</span>
              <span className={styles.value}>{profile.hometown}</span>
            </div>
          )}

          {profile.hobby && (
            <div className={styles.row}>
              <span className={styles.label}>趣味</span>
              <span className={styles.value}>{profile.hobby}</span>
            </div>
          )}

          {optionProfiles.map((optionProfile, idx) => (
            <div className={styles.row} key={idx}>
              <span className={styles.label}>{optionProfile.title}</span>
              <span className={styles.value}>{optionProfile.content}</span>
            </div>
          ))}
        </div>

        {links.length > 0 && (
          <div className={styles.linksSection}>
            <h3 className={styles.sectionTitle}>リンク</h3>
            <div className={styles.linksGrid}>
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.linkCard}
                >
                  <div className={styles.linkContent}>
                    <div className={styles.linkIconContainer}>
                      {/* {link.image_url ? (
                        <img
                          src={link.image_url}
                          alt={`${link.title}のアイコン`}
                          className={styles.linkIcon}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }} */}
                      {link.image_url ? (
                        <Image
                          src={link.image_url}
                          alt={`${link.title}のアイコン`}
                          className={styles.linkIcon}
                          width={40}
                          height={40}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          className={styles.linkIcon}
                          style={{
                            backgroundColor: "#f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            color: "#77a0ed",
                          }}
                        >
                          🔗
                        </div>
                      )}
                    </div>
                    <div className={styles.linkInfo}>
                      <h4 className={styles.linkTitle}>{link.title}</h4>
                      {link.description && (
                        <p className={styles.linkDescription}>
                          {link.description}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* フレンド情報編集ボタン - 自分自身のプロフィールではない場合のみ表示 */}
        {userProfiles.length > 0 && !isOwner && (
          <div className={styles.friendSection}>
            {addFriendResult && (
              <div className={`${styles.resultMessage} ${addFriendResult.success ? styles.success : styles.error}`}>
                {addFriendResult.message}
              </div>
            )}
            
            {!friendForm.isOpen ? (
              <button
                className={styles.addFriendButton}
                onClick={toggleFriendForm}
              >
                {friendForm.existingConnectionId ? 'フレンド情報編集' : 'フレンド追加'}
              </button>
            ) : (
              <form onSubmit={handleAddFriend} className={styles.friendForm}>
                <h3>{friendForm.existingConnectionId ? 'フレンド情報を編集' : 'フレンド追加'}</h3>

                {/* プロフィール選択は削除し、選択されたプロフィールの表示のみにする */}
                {userProfiles.length > 0 && selectedProfileId && (
                  <div className={styles.selectedProfileInfo}>
                    <p>使用プロフィール: {userProfiles.find(p => p.id === selectedProfileId)?.display_name || '不明'}</p>
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label htmlFor="eventName">イベント名:</label>
                  <input 
                    type="text"
                    id="eventName"
                    value={friendForm.eventName}
                    onChange={(e) => setFriendForm(prev => ({ ...prev, eventName: e.target.value }))}
                    placeholder="例: 技術交流会"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="eventDate">イベント日付:</label>
                  <input 
                    type="date"
                    id="eventDate"
                    value={friendForm.eventDate}
                    onChange={(e) => setFriendForm(prev => ({ ...prev, eventDate: e.target.value }))}
                    style={{ color: '#0056b3' }}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="memo">メモ:</label>
                  <textarea
                    id="memo"
                    value={friendForm.memo}
                    onChange={(e) => setFriendForm(prev => ({ ...prev, memo: e.target.value }))}
                    placeholder="例: エンジニアのAさん"
                    rows={3}
                  />
                </div>
                
                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={toggleFriendForm}
                  >
                    キャンセル
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={friendForm.isSubmitting || !selectedProfileId}
                  >
                    {friendForm.isSubmitting ? '更新中...' : (friendForm.existingConnectionId ? '編集を完了する' : 'フレンドに追加')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        
        {isOwner && (
          <button
            className={styles.editButton}
            onClick={() => router.push(`/profile/${params.id}/edit`)}
          >
            ✎ プロフィールを編集
          </button>
        )}

        <button className={styles.backButton} onClick={() => router.back()}>
          戻る
        </button>
      </div>
    </div>
  );
}
