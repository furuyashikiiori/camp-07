'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import Link from 'next/link';
import { authenticatedFetch } from '@/utils/auth';

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

type OptionalField = {
  id?: number;
  label: string;
  value: string;
};

type PresetLinkType = {
  name: string;
  icon_url: string;
  base_url: string;
  placeholder: string;
};

type OtherLink = {
  id?: number | string;
  isPreset: boolean;
  presetType?: PresetLinkType;
  label: string;
  url: string;
  description: string;
  iconFile?: File;
  isNew?: boolean;
  isDeleted?: boolean;
};

// リンク選択モーダルコンポーネント
function LinkSelectionModal({
  isOpen,
  onClose,
  onSelectPreset,
  onSelectOther,
  presetTypes,
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
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.presetSection}>
            <div className={styles.presetGrid}>
              {presetTypes.map((preset, index) => (
                <button
                  key={preset.name || `preset-${index}`}
                  onClick={() => onSelectPreset(preset)}
                  className={styles.presetButton}
                >
                  <Image
                    src={preset.icon_url}
                    alt={preset.name}
                    className={styles.presetIcon}
                    width={24}
                    height={24}
                  />
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
  onRemove,
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
            <Image
              src={link.presetType.icon_url}
              alt={link.presetType.name}
              className={styles.linkIcon}
              width={24}
              height={24}
            />
            <span className={styles.linkTitle}>{link.presetType.name}</span>
          </div>
        ) : (
          <div className={styles.customHeader}>
            <span className={styles.linkTitle}>
              {link.label || "カスタムリンク"}
            </span>
          </div>
        )}
        <button
          type='button'
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
              type='text'
              placeholder='リンク名'
              value={link.label}
              onChange={(e) => handleChange("label", e.target.value)}
              className={styles.linkInput}
            />
            <label className={styles.fileLabel}>
              アイコン画像（任意）:
              <input
                type='file'
                accept='image/*'
                onChange={(e) =>
                  handleChange(
                    "iconFile",
                    e.target.files?.[0] || new File([], "")
                  )
                }
                className={styles.fileInput}
              />
            </label>
          </>
        )}

        <input
          type='url'
          placeholder='URL'
          value={link.url}
          onChange={(e) => handleChange("url", e.target.value)}
          className={styles.linkInput}
        />

        <textarea
          placeholder='リンクの説明（任意）'
          value={link.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className={styles.linkTextarea}
        />
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [presetTypes, setPresetTypes] = useState<PresetLinkType[]>([]);
  
  const [formData, setFormData] = useState({
    profileTitle: '',
    profileDescription: '',
    name: '',
    title: '',
    bio: '',
    birthday: '',
    birthplace: '',
    hobby: '',
    sns: {
      twitter: '',
      instagram: '',
      github: '',
    },
    optionalFields: [{ label: '', value: '' }] as OptionalField[],
    otherLinks: [] as OtherLink[],
  });
  
  // 元の既存リンクを保持（変更差分計算用）
  const [originalLinks, setOriginalLinks] = useState<LinkItem[]>([]);

  // プリセットリンクタイプを取得
  useEffect(() => {
    const fetchPresetTypes = async () => {
      try {
        const response = await authenticatedFetch('/api/links/types/common');
        if (response.ok) {
          const data = await response.json();
          setPresetTypes(data.link_types || []);
        }
      } catch (error) {
        console.error('プリセットリンクタイプの取得エラー:', error);
      }
    };
    fetchPresetTypes();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, optionResponse, linksResponse] = await Promise.all([
          authenticatedFetch(`/api/profiles/${params.id}`),
          authenticatedFetch(`/api/profiles/${params.id}/option-profiles`),
          authenticatedFetch(`/api/links/profile/${params.id}`),
        ]);

        if (!profileResponse.ok) {
          throw new Error('プロフィールの取得に失敗しました');
        }
        
        const profileData = await profileResponse.json();
        setProfile(profileData);

        // 既存のオプションプロフィールを取得
        let existingOptions: OptionProfile[] = [];
        if (optionResponse.ok) {
          const optionData = await optionResponse.json();
          existingOptions = optionData.option_profiles || [];
        }

        // 既存のリンクを取得
        let existingLinks: LinkItem[] = [];
        if (linksResponse.ok) {
          const linksData = await linksResponse.json();
          existingLinks = linksData.links || [];
        }

        // SNSリンクを分離
        const snsLinks = existingLinks.filter(link => 
          ['Twitter', 'Instagram', 'GitHub'].includes(link.title)
        );
        const otherLinks = existingLinks.filter(link => 
          !['Twitter', 'Instagram', 'GitHub'].includes(link.title)
        );

        // フォームデータを設定
        setFormData({
          profileTitle: profileData.title || '',
          profileDescription: profileData.description || '',
          name: profileData.display_name || '',
          title: profileData.aka || '',
          bio: profileData.comment || '',
          birthday: profileData.birthdate ? profileData.birthdate.split('T')[0] : '',
          birthplace: profileData.hometown || '',
          hobby: profileData.hobby || '',
          sns: {
            twitter: snsLinks.find(link => link.title === 'Twitter')?.url || '',
            instagram: snsLinks.find(link => link.title === 'Instagram')?.url || '',
            github: snsLinks.find(link => link.title === 'GitHub')?.url || '',
          },
          optionalFields: existingOptions.length > 0 
            ? existingOptions.map(opt => ({ id: opt.id, label: opt.title, value: opt.content }))
            : [{ label: '', value: '' }],
          otherLinks: otherLinks.length > 0 
            ? otherLinks.map(link => ({ 
                id: link.id, 
                isPreset: presetTypes.some(preset => preset.name === link.title),
                presetType: presetTypes.find(preset => preset.name === link.title),
                label: link.title, 
                url: link.url, 
                description: link.description || '',
                isNew: false
              }))
            : [],
        });
        
        // 元のリンク情報を保存
        setOriginalLinks(existingLinks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (presetTypes.length > 0) {
      fetchData();
    }
  }, [params.id, presetTypes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    fieldType?: 'label' | 'value' | 'url' | 'description',
    targetList?: 'optionalFields' | 'otherLinks'
  ) => {
    const { name, value } = e.target;

    if (index !== undefined && fieldType && targetList) {
      const updated = [...formData[targetList]];
      if (targetList === 'optionalFields' && (fieldType === 'label' || fieldType === 'value')) {
        (updated as OptionalField[])[index][fieldType] = value;
      } else if (targetList === 'otherLinks' && 
        (fieldType === 'label' || fieldType === 'url' || fieldType === 'description')) {
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
      optionalFields: [...formData.optionalFields, { label: '', value: '' }],
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
      url: '',
      description: '',
      isNew: true,
    };

    console.log('プリセットリンク追加:', newLink);
    
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
      label: '',
      url: '',
      description: '',
      isNew: true,
    };

    console.log('カスタムリンク追加:', newLink);
    
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
    const linkToRemove = formData.otherLinks[index];
    
    // 新規リンクの場合は単純に配列から削除
    if (linkToRemove.isNew) {
      const updated = formData.otherLinks.filter((_, i) => i !== index);
      setFormData({ ...formData, otherLinks: updated });
    } else {
      // 既存リンクの場合は削除フラグを立てる（UIからは非表示）
      const updated = [...formData.otherLinks];
      updated[index] = { ...updated[index], isDeleted: true };
      setFormData({ ...formData, otherLinks: updated });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.profileTitle.trim()) {
      alert('プロフィールタイトルは必須です。');
      return;
    }

    if (!formData.name.trim()) {
      alert('名前は必須です。');
      return;
    }

    try {
      // アイコン画像をbase64に変換
      let iconBase64 = '';
      if (iconFile) {
        iconBase64 = await fileToBase64(iconFile);
      }

      // プロフィール基本情報を更新
      const profileData = {
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

      const response = await authenticatedFetch(`/api/profiles/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('プロフィールの更新に失敗しました');
      }

      // 任意項目の更新
      await updateOptionalFields();

      // リンクの更新
      console.log('全リンクデータ送信前:', formData.otherLinks);
      await updateLinks();

      alert('プロフィールを更新しました！');
      router.push(`/profile/${params.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新中にエラーが発生しました');
    }
  };

  const updateOptionalFields = async () => {
    // 既存の任意項目をすべて削除
    const existingOptions = formData.optionalFields.filter(field => field.id);
    for (const option of existingOptions) {
      try {
        await authenticatedFetch(`/api/option_profiles/${option.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('任意項目の削除エラー:', error);
      }
    }

    // 新しい任意項目を追加
    for (const field of formData.optionalFields) {
      if (field.label.trim() && field.value.trim()) {
        try {
          const optionData = {
            title: field.label,
            content: field.value,
            profile_id: Number(params.id),
          };

          await authenticatedFetch('/api/option_profiles', {
            method: 'POST',
            body: JSON.stringify(optionData),
          });
        } catch (error) {
          console.error('任意項目の保存エラー:', error);
        }
      }
    }
  };

  const updateLinks = async () => {
    // 削除対象のリンクを処理
    const linksToDelete = formData.otherLinks.filter(link => link.isDeleted && link.id && !link.isNew);
    for (const link of linksToDelete) {
      try {
        await authenticatedFetch(`/api/links/${link.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('リンクの削除エラー:', error);
      }
    }

    // SNSリンクの削除と再作成
    const snsLinks = ['Twitter', 'Instagram', 'GitHub'];
    for (const snsType of snsLinks) {
      try {
        // 既存のSNSリンクを削除（エラーが出ても続行）
        await authenticatedFetch(`/api/links/profile/${params.id}/${snsType}`, {
          method: 'DELETE',
        });
      } catch {
        // 削除エラーは無視
      }
    }

    // バックエンドからプリセットアイコン情報を取得
    let presetIcons: Record<string, string> = {};
    try {
      const response = await authenticatedFetch('/api/links/types/common');
      if (response.ok) {
        const data = await response.json();
        const commonTypes = data.link_types || data || [];
        if (Array.isArray(commonTypes)) {
          presetIcons = commonTypes.reduce(
            (acc: Record<string, string>, type: { name: string; icon_url: string }) => {
              const key = type.name.includes('/') ? type.name.split('/')[0] : type.name;
              acc[key] = type.icon_url;
              return acc;
            },
            {}
          );
        }
      }
    } catch (error) {
      console.error('プリセットアイコン情報の取得エラー:', error);
    }
    
    // フォールバック用のデフォルトアイコン
    if (Object.keys(presetIcons).length === 0) {
      presetIcons = {
        Twitter: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg',
        Instagram: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
        GitHub: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
      };
    }

    // SNSリンクを保存
    const snsLinksData = [
      { title: 'Twitter', url: formData.sns.twitter },
      { title: 'Instagram', url: formData.sns.instagram },
      { title: 'GitHub', url: formData.sns.github },
    ];

    for (const link of snsLinksData) {
      if (link.url.trim()) {
        try {
          const snsLinkData = {
            user_id: profile?.user_id,
            profile_id: Number(params.id),
            title: link.title,
            url: link.url,
            image_url: presetIcons[link.title],
          };

          await authenticatedFetch('/api/links', {
            method: 'POST',
            body: JSON.stringify(snsLinkData),
          });
        } catch (error) {
          console.error('SNSリンクの保存エラー:', error);
        }
      }
    }

    // 既存リンクの更新処理
    const linksToUpdate = formData.otherLinks.filter(link => 
      !link.isNew && !link.isDeleted && link.id
    );
    
    for (const link of linksToUpdate) {
      // 元のリンクと比較して変更があるかチェック
      const originalLink = originalLinks.find(orig => orig.id === link.id);
      if (originalLink && (
        originalLink.title !== link.label ||
        originalLink.url !== link.url ||
        originalLink.description !== (link.description || '')
      )) {
        try {
          let imageUrl = originalLink.image_url; // デフォルトは既存のアイコンを保持

          if (link.isPreset && link.presetType) {
            imageUrl = link.presetType.icon_url;
          } else if (link.iconFile && link.iconFile.size > 0) {
            const iconBase64 = await fileToBase64(link.iconFile);
            imageUrl = `data:${link.iconFile.type};base64,${iconBase64}`;
          }

          const linkData = {
            title: link.label,
            url: link.url,
            description: link.description || null,
            image_url: imageUrl,
          };

          await authenticatedFetch(`/api/links/${link.id}`, {
            method: 'PUT',
            body: JSON.stringify(linkData),
          });
        } catch (error) {
          console.error('リンクの更新エラー:', error);
        }
      }
    }

    // 新規リンクの追加処理
    const linksToAdd = formData.otherLinks.filter(link => link.isNew && !link.isDeleted);
    console.log('追加対象のリンク:', linksToAdd);
    
    for (const link of linksToAdd) {
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
            user_id: profile?.user_id,
            profile_id: Number(params.id),
            title: link.label,
            url: link.url,
            description: link.description || null,
            image_url: imageUrl,
          };

          console.log('新規リンク作成データ:', linkData);
          
          const response = await authenticatedFetch('/api/links', {
            method: 'POST',
            body: JSON.stringify(linkData),
          });

          console.log('新規リンク作成レスポンス:', response.status, response.ok);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('新規リンク作成エラー詳細:', errorData);
          } else {
            const resultData = await response.json().catch(() => ({}));
            console.log('新規リンク作成成功:', resultData);
          }
        } catch (error) {
          console.error('リンクの保存エラー:', error);
        }
      } else {
        console.log('URLが空のため追加をスキップ:', link);
      }
    }
  };

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
          <p className={styles.message}>{error || 'プロフィールが見つかりませんでした。'}</p>
          <button className={styles.backButton} onClick={() => router.back()}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/profile/${params.id}`} className={styles.backLink}>
        &lt; Back Profile
      </Link>

      <div className={styles.overlay}>
        <h1 className={styles.title}>プロフィール編集</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            プロフィールタイトル*：
            <input
              type="text"
              name="profileTitle"
              required
              value={formData.profileTitle}
              onChange={handleChange}
            />
          </label>

          <label>
            概要：
            <textarea
              name="profileDescription"
              value={formData.profileDescription}
              onChange={handleChange}
            />
          </label>

          <label>
            アイコン画像をアップロード：
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          <label>
            名前*：
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </label>

          <label>
            肩書き：
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
          </label>

          <label>
            一言Bio：
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
            />
          </label>

          <label>
            誕生日：
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
            />
          </label>

          <label>
            出身地：
            <input
              type="text"
              name="birthplace"
              value={formData.birthplace}
              onChange={handleChange}
            />
          </label>

          <label>
            趣味：
            <input
              type="text"
              name="hobby"
              value={formData.hobby}
              onChange={handleChange}
            />
          </label>

          <h3>任意の項目（最大3つ）</h3>
          {formData.optionalFields.map((field, index) => (
            <div key={index} className={styles.optionalField}>
              <input
                type="text"
                placeholder="項目名"
                value={field.label}
                onChange={(e) => handleChange(e, index, 'label', 'optionalFields')}
              />
              <input
                type="text"
                placeholder="内容"
                value={field.value}
                onChange={(e) => handleChange(e, index, 'value', 'optionalFields')}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addOptionalField}
            className={styles.addOptionalButton}
          >
            任意項目を追加 +
          </button>

          <div className={styles.linksSection}>
            <h3>リンク</h3>

            {formData.otherLinks
              .filter(link => !link.isDeleted)
              .map((link) => {
                // 元のインデックスを維持するために元配列からインデックスを探す
                const originalIndex = formData.otherLinks.findIndex(l => l.id === link.id);
                return (
                  <LinkInputComponent
                    key={link.id || originalIndex}
                    link={link}
                    index={originalIndex}
                    onUpdate={updateLink}
                    onRemove={removeLink}
                  />
                );
              })}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={styles.addLinkButton}
            >
              リンクを追加 +
            </button>
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton}>
              更新する
            </button>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => router.push(`/profile/${params.id}`)}
            >
              キャンセル
            </button>
          </div>
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