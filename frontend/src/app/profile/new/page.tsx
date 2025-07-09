"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { getUser, getToken, authenticatedFetch } from "@/utils/auth";

type OptionalField = { label: string; value: string };
type OtherLink = {
  label: string;
  url: string;
  description: string;
  iconFile?: File;
};

interface FormData {
  profileTitle: string;
  profileDescription: string;
  name: string;
  title: string;
  bio: string;
  birthday: string;
  birthplace: string;
  hobby: string;
  sns: {
    twitter: string;
    instagram: string;
    github: string;
  };
  optionalFields: OptionalField[];
  otherLinks: OtherLink[];
}

export default function NewProfilePage() {
  const [formData, setFormData] = useState<FormData>({
    profileTitle: "",
    profileDescription: "",
    name: "",
    title: "",
    bio: "",
    birthday: "",
    birthplace: "",
    hobby: "",
    sns: {
      twitter: "",
      instagram: "",
      github: "",
    },
    optionalFields: [{ label: "", value: "" }],
    otherLinks: [{ label: "", url: "", description: "" }],
  });

  const [iconFile, setIconFile] = useState<File | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    fieldType?: "label" | "value" | "url" | "description",
    targetList?: "optionalFields" | "otherLinks"
  ) => {
    const { name, value } = e.target;

    if (index !== undefined && fieldType && targetList) {
      const updated = [...formData[targetList]];
      if (
        targetList === "optionalFields" &&
        (fieldType === "label" || fieldType === "value")
      ) {
        (updated as OptionalField[])[index][fieldType] = value;
      } else if (
        targetList === "otherLinks" &&
        (fieldType === "label" ||
          fieldType === "url" ||
          fieldType === "description")
      ) {
        (updated as OtherLink[])[index][fieldType] = value;
      }
      setFormData({ ...formData, [targetList]: updated });
    } else if (name in formData.sns) {
      setFormData({
        ...formData,
        sns: {
          ...formData.sns,
          [name]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIconFile(e.target.files[0]);
    }
  };

  const addOptionalField = () => {
    setFormData({
      ...formData,
      optionalFields: [...formData.optionalFields, { label: "", value: "" }],
    });
  };

  const addOtherLink = () => {
    setFormData({
      ...formData,
      otherLinks: [
        ...formData.otherLinks,
        { label: "", url: "", description: "" },
      ],
    });
  };

  const handleOtherLinkIconChange = (index: number, file: File | null) => {
    const updated = [...formData.otherLinks];
    updated[index].iconFile = file || undefined;
    setFormData({ ...formData, otherLinks: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profileTitle.trim()) {
      alert("プロフィールタイトルは必須です。");
      return;
    }

    if (!formData.name.trim()) {
      alert("名前は必須です。");
      return;
    }

    try {
      // ユーザー情報とトークンを取得
      const user = getUser();
      const token = getToken();

      if (!user || !token) {
        alert("ログインが必要です。");
        return;
      }

      // アイコン画像をbase64に変換
      let iconBase64 = "";
      if (iconFile) {
        iconBase64 = await fileToBase64(iconFile);
      }

      // APIリクエスト用のデータ構造に変換
      const profileData = {
        user_id: user.id,
        display_name: formData.name,
        icon_base64: iconBase64,
        aka: formData.title,
        hometown: formData.birthplace,
        birthdate: formData.birthday,
        hobby: formData.hobby,
        comment: formData.bio,
        title: formData.profileTitle,
        description: formData.profileDescription,
      };

      // 基本プロフィールを作成
      const response = await authenticatedFetch("/api/profiles", {
        method: "POST",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(
          `プロフィールの登録に失敗しました: ${error.error || "エラーが発生しました"
          }`
        );
        return;
      }

      const createdProfile = await response.json();
      console.log("作成されたプロフィール:", createdProfile);

      // オプション項目を保存
      await saveOptionalFields(createdProfile.id);

      // SNSリンクと任意のリンクを保存
      await saveLinks(createdProfile.id, user);

      alert("プロフィールを登録しました！");
      // プロフィール詳細ページまたはマイページに遷移
      window.location.href = "/mypage";
    } catch (error) {
      console.error("プロフィール登録エラー:", error);
      alert("プロフィールの登録中にエラーが発生しました。");
    }
  };

  // オプション項目を保存
  const saveOptionalFields = async (profileId: number) => {
    for (const field of formData.optionalFields) {
      if (field.label.trim() && field.value.trim()) {
        try {
          const optionData = {
            title: field.label,
            content: field.value,
            profile_id: profileId,
          };

          await authenticatedFetch("/api/option_profiles", {
            method: "POST",
            body: JSON.stringify(optionData),
          });
        } catch (error) {
          console.error("オプション項目の保存エラー:", error);
        }
      }
    }
  };

  // SNSリンクと任意のリンクを保存
  const saveLinks = async (profileId: number, user: any) => {
    // バックエンドからプリセットアイコン情報を取得
    let presetIcons: Record<string, string> = {};
    try {
      const response = await authenticatedFetch("/api/links/types/common");
      if (response.ok) {
        const commonTypes = await response.json();
        presetIcons = commonTypes.reduce(
          (acc: Record<string, string>, type: any) => {
            // "Twitter/X" -> "Twitter", "GitHub" -> "GitHub" などのマッピング
            const key = type.name.includes("/")
              ? type.name.split("/")[0]
              : type.name;
            acc[key] = type.icon_url;
            return acc;
          },
          {}
        );
      }
    } catch (error) {
      console.error("プリセットアイコン情報の取得エラー:", error);
      // フォールバック用のアイコンマッピング
      presetIcons = {
        Twitter: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg",
        Instagram:
          "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg",
        GitHub: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg",
      };
    }

    console.log("プリセットアイコン:", presetIcons);

    // SNSリンクを保存
    const snsLinks = [
      { title: "Twitter", url: formData.sns.twitter },
      { title: "Instagram", url: formData.sns.instagram },
      { title: "GitHub", url: formData.sns.github },
    ];

    for (const link of snsLinks) {
      if (link.url.trim()) {
        try {
          const snsLinkData = {
            user_id: user.id,
            profile_id: profileId,
            title: link.title,
            url: link.url,
            image_url: presetIcons[link.title],
          };

          console.log("SNSリンク保存データ:", snsLinkData);
          const response = await authenticatedFetch("/api/links", {
            method: "POST",
            body: JSON.stringify(snsLinkData),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("SNSリンク保存エラー:", error);
          } else {
            console.log("SNSリンク保存成功:", link.title);
          }
        } catch (error) {
          console.error("SNSリンクの保存エラー:", error);
          // console.error("SNSリンクの保存エラー詳細:", error.message);
        }
      }
    }

    // 任意のリンクを保存
    for (const link of formData.otherLinks) {
      if (link.label.trim() && link.url.trim()) {
        try {
          // アイコン画像をbase64に変換（存在する場合）
          let imageUrl = null;
          if (link.iconFile) {
            const iconBase64 = await fileToBase64(link.iconFile);
            imageUrl = `data:${link.iconFile.type};base64,${iconBase64}`;
          }

          const linkData = {
            user_id: user.id,
            profile_id: profileId,
            title: link.label,
            url: link.url,
            description: link.description || null,
            image_url: imageUrl,
          };

          console.log("任意リンク保存データ:", linkData);
          const response = await authenticatedFetch("/api/links", {
            method: "POST",
            body: JSON.stringify(linkData),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("任意リンク保存エラー:", error);
          } else {
            console.log("任意リンク保存成功:", link.label);
          }
        } catch (error) {
          console.error("任意リンクの保存エラー:", error);
          // console.error("任意リンクの保存エラー詳細:", error.message);
        }
      }
    }
  };

  // ファイルをbase64に変換するヘルパー関数
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/png;base64, の部分を除去してbase64のみを取得
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className={styles.container}>
      <Link href='/mypage' className={styles.backLink}>
        &lt; MyProfile Page
      </Link>
      <div className={styles.overlay}>
        <h1 className={styles.title}>プロフィール新規作成</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            プロフィールタイトル*：
            <input
              type='text'
              name='profileTitle'
              required
              value={formData.profileTitle}
              onChange={handleChange}
            />
          </label>

          <label>
            概要：
            <textarea
              name='profileDescription'
              value={formData.profileDescription}
              onChange={handleChange}
            />
          </label>

          <label>
            アイコン画像をアップロード：
            <input type='file' accept='image/*' onChange={handleFileChange} />
          </label>

          <label>
            名前*：
            <input
              type='text'
              name='name'
              required
              value={formData.name}
              onChange={handleChange}
            />
          </label>

          <label>
            肩書き：
            <input
              type='text'
              name='title'
              value={formData.title}
              onChange={handleChange}
            />
          </label>

          <label>
            一言Bio：
            <textarea name='bio' value={formData.bio} onChange={handleChange} />
          </label>

          <label>
            誕生日：
            <input
              type='date'
              name='birthday'
              value={formData.birthday}
              onChange={handleChange}
            />
          </label>

          <label>
            出身地：
            <input
              type='text'
              name='birthplace'
              value={formData.birthplace}
              onChange={handleChange}
            />
          </label>

          <label>
            趣味：
            <input
              type='text'
              name='hobby'
              value={formData.hobby}
              onChange={handleChange}
            />
          </label>

          <h3>任意の項目</h3>
          {formData.optionalFields.map((field, index) => (
            <div key={index} className={styles.optionalField}>
              <input
                type='text'
                placeholder='項目名'
                value={field.label}
                onChange={(e) =>
                  handleChange(e, index, "label", "optionalFields")
                }
              />
              <input
                type='text'
                placeholder='内容'
                value={field.value}
                onChange={(e) =>
                  handleChange(e, index, "value", "optionalFields")
                }
              />
            </div>
          ))}

          <button
            type='button'
            onClick={addOptionalField}
            className={styles.addOptionalButton}
          >
            任意項目を追加 +
          </button>

          <fieldset className={styles.snsSection}>
            <h3>SNSリンク</h3>

            <label>
              Twitter:
              <input
                type='url'
                name='twitter'
                value={formData.sns.twitter}
                onChange={handleChange}
              />
            </label>

            <label>
              Instagram:
              <input
                type='url'
                name='instagram'
                value={formData.sns.instagram}
                onChange={handleChange}
              />
            </label>

            <label>
              GitHub:
              <input
                type='url'
                name='github'
                value={formData.sns.github}
                onChange={handleChange}
              />
            </label>
          </fieldset>

          <h3>任意のリンクです</h3>
          {formData.otherLinks.map((link, index) => (
            <div key={index} className={styles.optionalField}>
              <input
                type='text'
                placeholder='リンク名'
                value={link.label}
                onChange={(e) => handleChange(e, index, "label", "otherLinks")}
              />
              <input
                type='url'
                placeholder='URL'
                value={link.url}
                onChange={(e) => handleChange(e, index, "url", "otherLinks")}
              />
              <textarea
                placeholder='リンクの説明（任意）'
                value={link.description}
                onChange={(e) =>
                  handleChange(e, index, "description", "otherLinks")
                }
              />
              <label>
                アイコン画像（任意）:
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) =>
                    handleOtherLinkIconChange(
                      index,
                      e.target.files?.[0] || null
                    )
                  }
                />
              </label>
            </div>
          ))}

          <button
            type='button'
            onClick={addOtherLink}
            className={styles.addOptionalButton}
          >
            任意リンクを追加 +
          </button>

          <button type='submit' className={styles.submitButton}>
            登録する
          </button>
        </form>
      </div>
    </div>
  );
}
