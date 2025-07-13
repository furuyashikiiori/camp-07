"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { authenticatedFetch, getUser } from "@/utils/auth";

// declare module "next-auth" {
//   interface User {
//     id: string
//

//   interface Session {
//     user: User & {
//       id: string
//     }
//   }
// }

import { getApiBaseUrl } from "@/utils/config";

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
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    null
  );
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [accessChecked, setAccessChecked] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 認証チェック
        const user = getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const [profileResponse, optionResponse] = await Promise.all([
          authenticatedFetch(`/api/profiles/${params.id}`),
          authenticatedFetch(`/api/profiles/${params.id}/option-profiles`),
        ]);

        if (!profileResponse.ok) {
          throw new Error("プロフィールの取得に失敗しました");
        }
        const profileData = await profileResponse.json();

        // アイコンURLが相対パスの場合、バックエンドの完全URLに変換
        if (profileData.icon_url) {
          if (profileData.icon_url.startsWith("/api/")) {
            profileData.icon_url = `${getApiBaseUrl()}${profileData.icon_url}`;
          } else if (!profileData.icon_url.startsWith("http")) {
            // URLがhttpで始まらない場合もAPIベースURLを追加
            profileData.icon_url = `${getApiBaseUrl()}/api/profiles/${
              profileData.id
            }/icon`;
          }
          console.log("アイコンURL:", profileData.icon_url);
        }

        setProfile(profileData);

        if (optionResponse.ok) {
          const optionData = await optionResponse.json();
          setOptionProfiles(optionData.option_profiles || []);
        } else {
          console.log("Option profiles response error:", optionResponse.status);
        }

        // ユーザー情報は既に取得済み

        // プロフィールの所有者かどうかを判定
        if (user && profileData.user_id === Number(user.id)) {
          setIsOwner(true);
          setHasAccess(true); // 所有者は常にアクセス可能
        } else {
          setIsOwner(false);
          // 所有者でない場合、交換済みかどうかをチェック
          await checkExchangeRelation(user, profileData.id);
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
              if (
                userProfilesData.profiles &&
                userProfilesData.profiles.length > 0
              ) {
                const firstProfileId = userProfilesData.profiles[0].id;
                setSelectedProfileId(firstProfileId);

                // 既存のコネクション情報を取得 (自分のプロフィールでない場合のみ)
                if (!isOwner && profileData.id) {
                  try {
                    // セッションストレージから参照元を取得
                    const referrer = sessionStorage.getItem("referrer");
                    
                    // リストページからの遷移の場合は必ず接続済みとして扱う
                    // 空のコネクションIDを仮設定して、後で本物を探す
                    if (referrer === "listpage") {
                      setFriendForm((prev) => ({
                        ...prev,
                        existingConnectionId: -1, // 仮のID、後で上書きされる
                      }));
                    }
                    
                    // 自分のプロフィールから相手のプロフィールへのコネクションを確認
                    const connectionsResponse = await authenticatedFetch(
                      `/api/connections?profile_id=${firstProfileId}`
                    );

                    if (connectionsResponse.ok) {
                      const connectionsData = await connectionsResponse.json();
                      // 表示中のプロフィールとのコネクションを検索
                      const existingConnection =
                        connectionsData.connections?.find(
                          (conn: { connect_user_profile_id: number }) =>
                            conn.connect_user_profile_id === profileData.id
                        );

                      if (existingConnection) {
                        // 既存のコネクション情報をフォームに設定
                        setFriendForm((prev) => ({
                          ...prev,
                          eventName: existingConnection.event_name || "",
                          eventDate: existingConnection.event_date || "",
                          memo: existingConnection.memo || "",
                          existingConnectionId: existingConnection.id,
                        }));
                      } else {
                        // 相手のプロフィールから自分のプロフィールへのコネクションも確認
                        // (QRコード交換時に相手側が作成した可能性がある)
                        const reverseConnectionsResponse =
                          await authenticatedFetch(
                            `/api/connections?profile_id=${profileData.id}`
                          );

                        if (reverseConnectionsResponse.ok) {
                          const reverseConnectionsData =
                            await reverseConnectionsResponse.json();
                          const reverseConnection =
                            reverseConnectionsData.connections?.find(
                              (conn: { connect_user_profile_id: number }) =>
                                conn.connect_user_profile_id === firstProfileId
                            );

                          if (reverseConnection) {
                            // 既存のコネクション情報をフォームに設定 (双方向のコネクションを考慮)
                            setFriendForm((prev) => ({
                              ...prev,
                              eventName: reverseConnection.event_name || "",
                              eventDate: reverseConnection.event_date || "",
                              memo: reverseConnection.memo || "",
                              existingConnectionId: reverseConnection.id,
                            }));
                          } else if (referrer === "listpage") {
                            // リストページからの遷移なのにコネクションが見つからない場合
                            // フレンド情報編集ボタンを表示するため、ダミーのIDを残す
                            console.warn("リストからの遷移だがコネクション情報が見つかりませんでした");
                            // 空のデータでも編集可能にする
                            setFriendForm((prev) => ({
                              ...prev,
                              eventName: "",
                              eventDate: "",
                              memo: "",
                              existingConnectionId: -1, // 仮のID
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
        setAccessChecked(true);
      }
    };

    fetchData();
  }, [params.id, router]);

  // 交換関係をチェックする関数
  const checkExchangeRelation = async (
    user: { id: number },
    targetProfileId: number
  ) => {
    if (!user) {
      setHasAccess(false);
      return;
    }

    try {
      // ユーザーの全プロフィールを取得
      const userProfilesResponse = await authenticatedFetch(
        `/api/users/${user.id}/profiles`
      );

      if (!userProfilesResponse.ok) {
        setHasAccess(false);
        return;
      }

      const userProfilesData = await userProfilesResponse.json();
      const userProfiles = userProfilesData.profiles || [];

      // 各プロフィールについて、対象プロフィールとの交換関係をチェック
      for (const userProfile of userProfiles) {
        // 自分のプロフィールから相手への接続をチェック
        const connectionsResponse = await authenticatedFetch(
          `/api/connections?profile_id=${userProfile.id}`
        );

        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json();
          const hasConnection = connectionsData.connections?.some(
            (conn: { connect_user_profile_id: number }) =>
              conn.connect_user_profile_id === targetProfileId
          );

          if (hasConnection) {
            setHasAccess(true);
            return;
          }
        }

        // 相手のプロフィールから自分への接続もチェック
        const reverseConnectionsResponse = await authenticatedFetch(
          `/api/connections?profile_id=${targetProfileId}`
        );

        if (reverseConnectionsResponse.ok) {
          const reverseConnectionsData =
            await reverseConnectionsResponse.json();
          const hasReverseConnection = reverseConnectionsData.connections?.some(
            (conn: { connect_user_profile_id: number }) =>
              conn.connect_user_profile_id === userProfile.id
          );

          if (hasReverseConnection) {
            setHasAccess(true);
            return;
          }
        }
      }

      // どのプロフィールでも交換関係が見つからない場合
      setHasAccess(false);
    } catch (err) {
      console.error("交換関係チェックエラー:", err);
      setHasAccess(false);
    }
  };

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
      let isUpdate = true;
      
      // セッションストレージから参照元を取得
      const referrer = sessionStorage.getItem("referrer");
      
      // リストページからの遷移の場合、必ず更新処理を行う
      if (referrer === "listpage") {
        isUpdate = true;
      } else {
        // それ以外の場合は既存のコネクションIDに基づいて判断
        isUpdate = !!friendForm.existingConnectionId;
      }

      // 更新処理
      if (isUpdate) {
        if (friendForm.existingConnectionId && friendForm.existingConnectionId > 0) {
          // 正常な既存のコネクションがある場合は更新
          // event_dateが空の場合は今日の日付を使用する
          const currentDate = friendForm.eventDate || new Date().toISOString().split('T')[0];
          
          response = await authenticatedFetch(
            `/api/connections/${friendForm.existingConnectionId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                event_name: friendForm.eventName,
                event_date: currentDate,
                memo: friendForm.memo,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("フレンド情報の更新に失敗しました");
          }
        } else {
          // 仮ID(-1)が設定されている場合、リストページから来たが実際のコネクションが見つからない
          // この場合は新規作成する
          console.log("リストページからの遷移ですが、コネクションIDが見つからないため新規作成します");
          
          // event_dateが空の場合は今日の日付を使用する
          const currentDate = friendForm.eventDate || new Date().toISOString().split('T')[0];
          
          const myToFriendResponse = await authenticatedFetch(
            "/api/connections",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                profile_id: selectedProfileId,
                connect_user_profile_id: profile.id,
                event_name: friendForm.eventName,
                event_date: currentDate,
                memo: friendForm.memo,
              }),
            }
          );

          if (!myToFriendResponse.ok) {
            throw new Error("フレンド情報の更新に失敗しました");
          }
          
          // IDを取得して状態を更新
          const data = await myToFriendResponse.json();
          if (data?.connection?.id) {
            setFriendForm((prev) => ({
              ...prev,
              existingConnectionId: data.connection.id,
            }));
          }
        }
        
        // 相互のコネクションの存在確認のみ行い、更新はしない
        try {
          // 相手のプロフィールからのコネクションを検索（存在確認のみ）
          const connectionsResponse = await authenticatedFetch(
            `/api/connections?profile_id=${profile.id}`
          );
          
          if (connectionsResponse.ok) {
            const connectionsData = await connectionsResponse.json();
            const reverseConnection = connectionsData.connections?.find(
              (conn: { connect_user_profile_id: number }) =>
                conn.connect_user_profile_id === selectedProfileId
            );
            
            if (reverseConnection && reverseConnection.id) {
              // 相手側のコネクションの存在を確認するだけで、更新は行わない
              console.log("相互コネクションの存在を確認しました。相手側の情報は更新しません。");
            }
          }
        } catch (err) {
          console.error("相互コネクション確認エラー:", err);
          // エラーがあっても処理は継続
        }
      } else {
        // 新規作成処理
        // QRコード交換のケースかどうかを判断（セッションストレージから参照元を取得）
        const referrer = sessionStorage.getItem("referrer");
        const isQRExchange = referrer === "qrpage" || referrer === "exchange";
        
        // event_dateが空の場合は今日の日付を使用する
        const currentDate = friendForm.eventDate || new Date().toISOString().split('T')[0];
        
        // 自分から相手へのコネクションを作成
        const myToFriendResponse = await authenticatedFetch(
          "/api/connections",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              profile_id: selectedProfileId,
              connect_user_profile_id: profile.id,
              event_name: friendForm.eventName,
              event_date: currentDate,
              memo: friendForm.memo,
            }),
          }
        );
        
        if (!myToFriendResponse.ok) {
          throw new Error("フレンド追加に失敗しました");
        }
        
        // QRコード交換のケースのみ、相手から自分へのコネクションも作成（相互関係）
        if (isQRExchange) {
          console.log("QRコード交換のケースなので、相互コネクションを作成します");
          const friendToMyResponse = await authenticatedFetch(
            "/api/connections",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                profile_id: profile.id,
                connect_user_profile_id: selectedProfileId,
                // QRコード交換時は相手側も同じイベント情報を持つ
                event_name: friendForm.eventName,
                event_date: currentDate, // 空の場合は今日の日付
                memo: friendForm.memo,
              }),
            }
          );
          
          if (!friendToMyResponse.ok) {
            console.warn("相互コネクション作成に失敗しましたが、処理を継続します");
          }
        } else {
          console.log("通常のフレンド追加のため、自分側のコネクションのみを作成します");
        }

        // 新規作成後、IDを取得して状態を更新
        if (myToFriendResponse.ok) {
          const data = await myToFriendResponse.json();
          if (data?.connection?.id) {
            setFriendForm((prev) => ({
              ...prev,
              existingConnectionId: data.connection.id,
            }));
          }
        }
      }

      setAddFriendResult({
        success: true,
        message: "フレンド情報を更新しました！",
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

  if (loading || !accessChecked) {
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
          <button
            className={styles.backButton}
            onClick={() => {
              // セッションストレージから参照元を取得
              const referrer = sessionStorage.getItem("referrer");

              // 参照元に基づいて戻る先を決定
              if (referrer === "listpage") {
                router.push("/listpage");
              } else if (referrer === "mypage") {
                router.push("/mypage");
              } else {
                // 参照元情報がない場合はブラウザの戻る機能を使用
                router.back();
              }
            }}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // アクセス権限がない場合の表示
  if (!hasAccess) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay}>
          <p className={styles.message}>
            このプロフィールを表示する権限がありません。
            <br />
            プロフィールの作成者または交換済みの方のみ閲覧できます。
          </p>
          <button
            className={styles.backButton}
            onClick={() => {
              // セッションストレージから参照元を取得
              const referrer = sessionStorage.getItem("referrer");

              // 参照元に基づいて戻る先を決定
              if (referrer === "listpage") {
                router.push("/listpage");
              } else if (referrer === "mypage") {
                router.push("/mypage");
              } else {
                // 参照元不明の場合はマイページに戻る
                router.push("/mypage");
              }
            }}
          >
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
        ⬅︎ HOME
      </Link>

      {/* 編集ボタンをoverlayの外に移動 */}
      {isOwner && (
        <button
          className={styles.editButton}
          onClick={() => router.push(`/profile/${params.id}/edit`)}
        >
          ✎ プロフィールを編集
        </button>
      )}

      <div className={styles.overlay}>
        <div className={styles.profileHeader}>
          {profile.icon_url && (
            <div className={styles.iconContainer}>
              {/* Next/Imageコンポーネントを使う代わりに標準のimgタグを使用 */}
              <img
                src={profile.icon_url}
                alt={`${profile.display_name}のアイコン`}
                className={styles.profileIcon}
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
                        <img
                          src={link.image_url}
                          alt={`${link.title}のアイコン`}
                          className={styles.linkIcon}
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
              <div
                className={`${styles.resultMessage} ${
                  addFriendResult.success ? styles.success : styles.error
                }`}
              >
                {addFriendResult.message}
              </div>
            )}

            {!friendForm.isOpen ? (
              <button
                className={styles.addFriendButton}
                onClick={toggleFriendForm}
              >
                フレンド情報編集
              </button>
            ) : (
              <form onSubmit={handleAddFriend} className={styles.friendForm}>
                <h3>
                  フレンド情報を編集
                </h3>

                {/* プロフィール選択は削除し、選択されたプロフィールの表示のみにする */}
                {userProfiles.length > 0 && selectedProfileId && (
                  <div className={styles.selectedProfileInfo}>
                    <p>
                      使用プロフィール:{" "}
                      {userProfiles.find((p) => p.id === selectedProfileId)
                        ?.display_name || "不明"}
                    </p>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor='eventName'>イベント名:</label>
                  <input
                    type='text'
                    id='eventName'
                    value={friendForm.eventName}
                    onChange={(e) =>
                      setFriendForm((prev) => ({
                        ...prev,
                        eventName: e.target.value,
                      }))
                    }
                    placeholder='例: 技術交流会'
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor='eventDate'>イベント日付:</label>
                  <input
                    type='date'
                    id='eventDate'
                    value={friendForm.eventDate}
                    onChange={(e) =>
                      setFriendForm((prev) => ({
                        ...prev,
                        eventDate: e.target.value,
                      }))
                    }
                    style={{ color: "#0056b3" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor='memo'>メモ:</label>
                  <textarea
                    id='memo'
                    value={friendForm.memo}
                    onChange={(e) =>
                      setFriendForm((prev) => ({
                        ...prev,
                        memo: e.target.value,
                      }))
                    }
                    placeholder='例: エンジニアのAさん'
                    rows={3}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type='button'
                    className={styles.cancelButton}
                    onClick={toggleFriendForm}
                  >
                    キャンセル
                  </button>
                  <button
                    type='submit'
                    className={styles.submitButton}
                    disabled={friendForm.isSubmitting || !selectedProfileId}
                  >
                    {friendForm.isSubmitting
                      ? "更新中..."
                      : friendForm.existingConnectionId
                      ? "編集を完了する"
                      : "フレンドに追加"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <button
          className={styles.backButton}
          onClick={() => {
            // セッションストレージから参照元を取得
            const referrer = sessionStorage.getItem("referrer");

            // 参照元に基づいて戻る先を決定
            if (referrer === "listpage") {
              router.push("/listpage");
            } else if (referrer === "mypage") {
              router.push("/mypage");
            } else {
              // 参照元情報がない場合、ユーザー所有のプロフィールかどうかで判断
              if (isOwner) {
                router.push("/mypage");
              } else {
                router.push("/listpage");
              }
            }
          }}
        >
          戻る
        </button>
      </div>
    </div>
  );
}