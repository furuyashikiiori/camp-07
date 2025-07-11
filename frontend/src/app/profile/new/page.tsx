"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { getUser, getToken, authenticatedFetch } from "@/utils/auth";

type OptionalField = { label: string; value: string };

type PresetLinkType = {
  id: string;
  name: string;
  icon_url: string;
};

type OtherLink = {
  id: string;
  isPreset: boolean;
  presetType?: PresetLinkType;
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

// リンク選択モーダルコンポーネント
function LinkSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectPreset, 
  onSelectOther,
  presetTypes 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetType: PresetLinkType) => void;
  onSelectOther: () => void;
  presetTypes: PresetLinkType[];
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>リンクタイプを選択</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.presetSection}>
            <div className={styles.presetGrid}>
              {presetTypes.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={styles.presetButton}
                >
                  <img src={preset.icon_url} alt={preset.name} className={styles.presetIcon} />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.customSection}>
            <h4>その他のリンク</h4>
            <button onClick={onSelectOther} className={styles.customButton}>
              <span>📎</span>
              <span>カスタムリンクを作成</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 個別リンク入力コンポーネント
function LinkInputComponent({ 
  link, 
  index, 
  onUpdate, 
  onRemove 
}: {
  link: OtherLink;
  index: number;
  onUpdate: (index: number, updatedLink: OtherLink) => void;
  onRemove: (index: number) => void;
}) {
  const handleChange = (field: keyof OtherLink, value: string | File) => {
    const updatedLink = { ...link, [field]: value };
    onUpdate(index, updatedLink);
  };

  return (
    <div className={styles.linkInputContainer}>
      <div className={styles.linkHeader}>
        {link.isPreset && link.presetType ? (
          <div className={styles.presetHeader}>
            <img src={link.presetType.icon_url} alt={link.presetType.name} className={styles.linkIcon} />
            <span className={styles.linkTitle}>{link.presetType.name}</span>
          </div>
        ) : (
          <div className={styles.customHeader}>
            <span className={styles.linkTitle}>{link.label || "カスタムリンク"}</span>
          </div>
        )}
        <button 
          type="button" 
          onClick={() => onRemove(index)}
          className={styles.removeButton}
        >
          削除
        </button>
      </div>

      <div className={styles.linkInputs}>
        {!link.isPreset && (
          <>
            <input
              type="text"
              placeholder="リンク名"
              value={link.label}
              onChange={(e) => handleChange("label", e.target.value)}
              className={styles.linkInput}
            />
            <label className={styles.fileLabel}>
              アイコン画像（任意）:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleChange("iconFile", e.target.files?.[0] || new File([], ""))}
                className={styles.fileInput}
              />
            </label>
          </>
        )}
        
        <input
          type="url"
          placeholder="URL"
          value={link.url}
          onChange={(e) => handleChange("url", e.target.value)}
          className={styles.linkInput}
        />
        
        <textarea
          placeholder="リンクの説明（任意）"
          value={link.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className={styles.linkTextarea}
        />
      </div>
    </div>
  );
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
    otherLinks: [],
  });

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [presetTypes, setPresetTypes] = useState<PresetLinkType[]>([]);

  // プリセットリンクタイプを取得
  useEffect(() => {
    const fetchPresetTypes = async () => {
      try {
        const response = await authenticatedFetch("/api/links/types/common");
        if (response.ok) {
          const data = await response.json();
          setPresetTypes(data.link_types || []);
        }
      } catch (error) {
        console.error("プリセットリンクタイプの取得エラー:", error);
      }
    };
    fetchPresetTypes();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    fieldType?: "label" | "value",
    targetList?: "optionalFields"
  ) => {
    const { name, value } = e.target;

    if (index !== undefined && fieldType && targetList) {
      const updated = [...formData[targetList]];
      (updated as OptionalField[])[index][fieldType] = value;
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

  const generateLinkId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleSelectPreset = (presetType: PresetLinkType) => {
    const newLink: OtherLink = {
      id: generateLinkId(),
      isPreset: true,
      presetType,
      label: presetType.name,
      url: "",
      description: "",
    };
    
    setFormData({
      ...formData,
      otherLinks: [...formData.otherLinks, newLink],
    });
    setIsModalOpen(false);
  };

  const handleSelectOther = () => {
    const newLink: OtherLink = {
      id: generateLinkId(),
      isPreset: false,
      label: "",
      url: "",
      description: "",
    };
    
    setFormData({
      ...formData,
      otherLinks: [...formData.otherLinks, newLink],
    });
    setIsModalOpen(false);
  };

  const updateLink = (index: number, updatedLink: OtherLink) => {
    const updated = [...formData.otherLinks];
    updated[index] = updatedLink;
    setFormData({ ...formData, otherLinks: updated });
  };

  const removeLink = (index: number) => {
    const updated = formData.otherLinks.filter((_, i) => i !== index);
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
      const user = getUser();
      const token = getToken();

      if (!user || !token) {
        alert("ログインが必要です。");
        return;
      }

      let iconBase64 = "";
      if (iconFile) {
        iconBase64 = await fileToBase64(iconFile);
      }

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

      const response = await authenticatedFetch("/api/profiles", {
        method: "POST",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`プロフィールの登録に失敗しました: ${error.error || "エラーが発生しました"}`);
        return;
      }

      const createdProfile = await response.json();
      console.log("作成されたプロフィール:", createdProfile);

      await saveOptionalFields(createdProfile.id);
      await saveLinks(createdProfile.id, user);

      alert("プロフィールを登録しました！");
      window.location.href = "/mypage";
    } catch (error) {
      console.error("プロフィール登録エラー:", error);
      alert("プロフィールの登録中にエラーが発生しました。");
    }
  };

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

  const saveLinks = async (profileId: number, user: any) => {
    // SNSリンクを保存
    const snsLinks = [
      { title: "Twitter", url: formData.sns.twitter },
      { title: "Instagram", url: formData.sns.instagram },
      { title: "GitHub", url: formData.sns.github },
    ];

    for (const link of snsLinks) {
      if (link.url.trim()) {
        try {
          const presetIcon = presetTypes.find(p => p.name.includes(link.title));
          const snsLinkData = {
            user_id: user.id,
            profile_id: profileId,
            title: link.title,
            url: link.url,
            image_url: presetIcon?.icon_url,
          };

          await authenticatedFetch("/api/links", {
            method: "POST",
            body: JSON.stringify(snsLinkData),
          });
        } catch (error) {
          console.error("SNSリンクの保存エラー:", error);
        }
      }
    }

    // 任意のリンクを保存
    for (const link of formData.otherLinks) {
      if (link.url.trim()) {
        try {
          let imageUrl = null;
          
          if (link.isPreset && link.presetType) {
            imageUrl = link.presetType.icon_url;
          } else if (link.iconFile && link.iconFile.size > 0) {
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

          await authenticatedFetch("/api/links", {
            method: "POST",
            body: JSON.stringify(linkData),
          });
        } catch (error) {
          console.error("リンクの保存エラー:", error);
        }
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
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
                onChange={(e) => handleChange(e, index, "label", "optionalFields")}
              />
              <input
                type='text'
                placeholder='内容'
                value={field.value}
                onChange={(e) => handleChange(e, index, "value", "optionalFields")}
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

          {/* <fieldset className={styles.snsSection}>
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
          </fieldset> */}

          <div className={styles.linksSection}>
            <h3>リンク</h3>
            
            {formData.otherLinks.map((link, index) => (
              <LinkInputComponent
                key={link.id}
                link={link}
                index={index}
                onUpdate={updateLink}
                onRemove={removeLink}
              />
            ))}

            <button
              type='button'
              onClick={() => setIsModalOpen(true)}
              className={styles.addLinkButton}
            >
              リンクを追加 +
            </button>
          </div>

          <button type='submit' className={styles.submitButton}>
            登録する
          </button>
        </form>
      </div>

      <LinkSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        onSelectOther={handleSelectOther}
        presetTypes={presetTypes}
      />
    </div>
  );
}