"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { authenticatedFetch } from "@/utils/auth";

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
        // console.log("Profile data received:", profileData); // デバッグログを追加
        // console.log("Profile icon_url:", profileData.icon_url); // アイコンURLを個別にログ

        // アイコンURLが相対パスの場合、バックエンドの完全URLに変換
        if (profileData.icon_url && profileData.icon_url.startsWith("/api/")) {
          profileData.icon_url = `http://localhost:8080${profileData.icon_url}`;
        }

        setProfile(profileData);

        if (optionResponse.ok) {
          const optionData = await optionResponse.json();
          // console.log("Option profiles data:", optionData);
          setOptionProfiles(optionData.option_profiles || []);
        } else {
          console.log("Option profiles response error:", optionResponse.status);
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

        <button className={styles.backButton} onClick={() => router.back()}>
          戻る
        </button>
      </div>
    </div>
  );
}
