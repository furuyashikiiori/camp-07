"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { getUser, User, authenticatedFetch, getToken } from "../../utils/auth";

type Profile = {
  id: number;
  user_id: number;
  display_name: string;
  icon_path?: string;
  icon_url?: string;
  aka?: string;
  hometown?: string;
  birthdate?: string;
  hobby?: string;
  comment?: string;
  title: string;
  description?: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    profileId: number | null;
    profileTitle: string;
    isDeleting: boolean; // 削除処理中かどうか
    hasConnections: boolean; // コネクション（フレンド）が存在するか
  }>({
    isOpen: false,
    profileId: null,
    profileTitle: "",
    isDeleting: false,
    hasConnections: false,
  });

  useEffect(() => {
    // ログイン中のユーザー情報を取得
    const user = getUser();
    const token = getToken();

    console.log("User:", user);
    console.log("Token:", token ? "Present" : "Missing");

    if (!user) {
      // ログインしていない場合はログインページにリダイレクト
      console.log("No user found, redirecting to login");
      router.push("/login");
      return;
    }

    setCurrentUser(user);

    // トークンがない場合の処理
    if (!token) {
      console.error("No authentication token found, showing test data");
      // テストデータを設定
      const testProfiles: Profile[] = [
        {
          id: 1,
          user_id: user.id,
          display_name: user.name,
          title: "ビジネス用プロフィール(no token)",
          description: "トークンがない場合のテストデータです。",
          aka: "エンジニア",
          hometown: "東京",
          hobby: "プログラミング",
          comment: "よろしくお願いします。",
        },
      ];
      setProfiles(testProfiles);
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      try {
        console.log("Fetching profiles for user ID:", user.id);
        const response = await authenticatedFetch(
          `/api/users/${user.id}/profiles`
        );
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);

          // バックエンドが起動していない場合のテストデータ
          console.warn("Backend not available, using test data");
          const testProfiles: Profile[] = [
            {
              id: 1,
              user_id: user.id,
              display_name: user.name,
              title: "ビジネス用プロフィール(test)",
              description: "ビジネス用のプロフィールです。",
              aka: "エンジニア",
              hometown: "東京",
              hobby: "プログラミング",
              comment: "よろしくお願いします。",
            },
            {
              id: 2,
              user_id: user.id,
              display_name: user.name,
              title: "趣味用プロフィール(test)",
              description: "趣味・SNS用のプロフィールです。",
              aka: "写真家",
              hometown: "神奈川",
              hobby: "写真撮影",
              comment: "写真を撮るのが好きです。",
            },
          ];
          setProfiles(testProfiles);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("Received data:", data);
        setProfiles(data.profiles || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("プロフィールの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [router]);

  // プロフィール削除処理
  const handleDeleteProfile = async (profileId: number) => {
    try {
      setDeleteConfirmation((prev) => ({ ...prev, isDeleting: true }));

      // 削除リクエストの実行
      const response = await authenticatedFetch(`/api/profiles/${profileId}`, {
        method: "DELETE",
      });

      // レスポンスのステータスコードをチェック
      if (!response.ok) {
        // エラーメッセージの詳細を追加
        throw new Error(
          `削除に失敗しました (${response.status}). サーバーエラーが発生しました。`
        );
      }

      // JSONレスポンスを正しく解析する（text()は一度しか呼べないため、json()を直接使う）
      try {
        // レスポンスのJSONをパース
        await response.json();
      } catch {
        // JSONパースエラーは無視（正常に削除できていれば問題ない）
        console.log(
          "レスポンスのJSONパースに失敗しましたが、削除は成功しました"
        );
      }

      // 成功したら、プロフィール一覧から削除したプロフィールを除外
      setProfiles(profiles.filter((p) => p.id !== profileId));

      // 確認ダイアログを閉じる
      setDeleteConfirmation({
        isOpen: false,
        profileId: null,
        profileTitle: "",
        isDeleting: false,
        hasConnections: false,
      });

      // ユーザーがプロフィールをすべて削除した場合、メッセージを表示
      if (profiles.length === 1) {
        setError(
          "プロフィールを作成してください。QRコードの交換にはプロフィールが必要です。"
        );
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        err instanceof Error ? err.message : "削除中にエラーが発生しました"
      );

      // 確認ダイアログを閉じる（エラー時も）
      setDeleteConfirmation((prev) => ({
        ...prev,
        isDeleting: false,
      }));
    }
  };

  // 削除確認ダイアログを表示
  const showDeleteConfirmation = async (
    e: React.MouseEvent,
    profile: Profile
  ) => {
    e.stopPropagation(); // クリックイベントの伝播を停止

    // 削除前にコネクション（フレンド情報）の有無を確認
    let hasConnections = false;
    try {
      // プロフィールに関連するコネクションを取得
      const response = await authenticatedFetch(
        `/api/connections?profile_id=${profile.id}`
      );
      if (response.ok) {
        const data = await response.json();
        hasConnections = data.connections && data.connections.length > 0;
      }
    } catch (err) {
      console.error("コネクション情報の取得中にエラーが発生しました:", err);
    }

    setDeleteConfirmation({
      isOpen: true,
      profileId: profile.id,
      profileTitle: profile.title,
      isDeleting: false,
      hasConnections,
    });
  };

  // 削除確認ダイアログをキャンセル
  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      profileId: null,
      profileTitle: "",
      isDeleting: false,
      hasConnections: false,
    });
  };

  return (
    <div className={styles.container}>
      <Link href='/' className={styles.backLink}>
        &lt; Back StartPage
      </Link>
      <div className={styles.overlay}>
        <h1 className={styles.title}>
          {currentUser ? `${currentUser.name}のプロフィール` : "MyProfile Page"}
        </h1>

        <button
          className={styles.newProfileButton}
          onClick={() => router.push("/profile/new")}
        >
          NewProfile ＋
        </button>

        <div className={styles.profileList}>
          {loading ? (
            <p className={styles.message}>読み込み中...</p>
          ) : error ? (
            <p className={styles.message}>{error}</p>
          ) : profiles.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.message}>プロフィールがまだありません。</p>
              <p className={styles.subMessage}>
                QRコードを作成・交換するには、プロフィールを作成する必要があります。
                <br />
                「NewProfile
                ＋」ボタンをクリックして、新しいプロフィールを作成しましょう！
              </p>
              <button
                className={`${styles.newProfileButton} ${styles.emptyStateButton}`}
                onClick={() => router.push("/profile/new")}
              >
                プロフィールを作成する ＋
              </button>
            </div>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className={styles.profileCard}>
                <div className={styles.profileCardContent}>
                  <div
                    className={styles.profileCardInfo}
                    onClick={() => {
                      sessionStorage.setItem('referrer', 'mypage');
                      router.push(`/profile/${profile.id}`);
                    }}
                  >
                    <h2 className={styles.cardTitle}>{profile.title}</h2>
                    <p className={styles.cardDescription}>
                      {profile.description || "プロフィールの説明がありません"}
                    </p>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => showDeleteConfirmation(e, profile)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* 削除確認ダイアログ */}
      {deleteConfirmation.isOpen && (
        <div className={styles.confirmDialog}>
          <div className={styles.confirmDialogContent}>
            <h3 className={styles.confirmTitle}>プロフィールの削除</h3>
            <p className={styles.confirmMessage}>
              「{deleteConfirmation.profileTitle}」を削除しますか？
              <br />
              この操作は取り消せません。
            </p>

            {deleteConfirmation.hasConnections && (
              <div className={styles.warningMessage}>
                <p>
                  ⚠️
                  このプロフィールはフレンド情報を持っています。削除すると、関連するすべてのフレンド情報も削除されます。
                </p>
              </div>
            )}

            {profiles.length <= 1 && (
              <div className={styles.warningMessage}>
                <p>
                  ⚠️
                  これは最後のプロフィールです。削除すると、新しいプロフィールを作成するまでQRコードの交換ができなくなります。
                </p>
              </div>
            )}

            <div className={styles.confirmButtons}>
              <button
                className={styles.cancelButton}
                onClick={cancelDelete}
                disabled={deleteConfirmation.isDeleting}
              >
                キャンセル
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={() =>
                  deleteConfirmation.profileId &&
                  handleDeleteProfile(deleteConfirmation.profileId)
                }
                disabled={deleteConfirmation.isDeleting}
              >
                {deleteConfirmation.isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
