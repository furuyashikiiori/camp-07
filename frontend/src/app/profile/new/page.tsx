'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

type OptionalField = { label: string; value: string };
type OtherLink = { label: string; url: string };

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
    optionalFields: [{ label: '', value: '' }],
    otherLinks: [{ label: '', url: '' }],
  });

  const [iconFile, setIconFile] = useState<File | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    fieldType?: 'label' | 'value' | 'url',
    targetList?: 'optionalFields' | 'otherLinks'
  ) => {
    const { name, value } = e.target;

    if (index !== undefined && fieldType && targetList) {
      const updated = [...formData[targetList]];
      if (targetList === 'optionalFields' && (fieldType === 'label' || fieldType === 'value')) {
        (updated as OptionalField[])[index][fieldType] = value;
      } else if (targetList === 'otherLinks' && (fieldType === 'label' || fieldType === 'url')) {
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

  const addOtherLink = () => {
    setFormData({
      ...formData,
      otherLinks: [...formData.otherLinks, { label: '', url: '' }],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profileTitle.trim()) {
      alert('プロフィールタイトルは必須です。');
      return;
    }

    if (!formData.name.trim()) {
      alert('名前は必須です。');
      return;
    }

    console.log('送信内容:', formData);
    console.log('アイコン画像:', iconFile);
    alert('プロフィールを登録しました（仮）');
  };

  return (
    <div className={styles.container}>
      <Link href="/mypage" className={styles.backLink}>
        &lt; MyProfile Page
      </Link>
      <div className={styles.overlay}>
        <h1 className={styles.title}>プロフィール新規作成</h1>
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
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
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

          <h3>任意の項目</h3>
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

          <fieldset className={styles.snsSection}>
            <h3>SNSリンク</h3>

            <label>
              Twitter:
              <input
                type="url"
                name="twitter"
                value={formData.sns.twitter}
                onChange={handleChange}
              />
            </label>

            <label>
              Instagram:
              <input
                type="url"
                name="instagram"
                value={formData.sns.instagram}
                onChange={handleChange}
              />
            </label>

            <label>
              GitHub:
              <input
                type="url"
                name="github"
                value={formData.sns.github}
                onChange={handleChange}
              />
            </label>
          </fieldset>

          <h3>任意のリンク</h3>
          {formData.otherLinks.map((link, index) => (
            <div key={index} className={styles.optionalField}>
              <input
                type="text"
                placeholder="リンク名"
                value={link.label}
                onChange={(e) => handleChange(e, index, 'label', 'otherLinks')}
              />
              <input
                type="url"
                placeholder="URL"
                value={link.url}
                onChange={(e) => handleChange(e, index, 'url', 'otherLinks')}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addOtherLink}
            className={styles.addOptionalButton}
          >
            任意リンクを追加 +
          </button>

          <button type="submit" className={styles.submitButton}>
            登録する
          </button>
        </form>
      </div>
    </div>
  );
}
