'use client';
import { useState, useEffect } from 'react';
import { apiGet, apiPut } from '@/services/api';
import styles from '../mentorship/page.module.css';
import hStyles from './page.module.css';

const DEFAULT = {
  hero: {
    title: 'The Art of Perfect Lashes',
    subtitle: 'Premium supplies, professional courses, and a community that lifts each other up.',
    imageUrl: '',
    videoUrl: '',
    ctaPrimary:   { text: 'Shop Now',    href: '/shop' },
    ctaSecondary: { text: 'Our Courses', href: '/academy' },
  },
  announcement: '',
};

export default function AdminHomepage() {
  const [settings, setSettings] = useState(DEFAULT);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    apiGet<any>('/api/site/settings').then(setSettings).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPut('/api/site/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function setHero(key: string, value: string) {
    setSettings(s => ({ ...s, hero: { ...s.hero, [key]: value } }));
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Homepage</h1>
          <p className={styles.pageSub}>Edit the hero banner and announcement bar</p>
        </div>
        {saved && <span className={hStyles.savedBadge}>✓ Saved</span>}
      </div>

      <form className={hStyles.body} onSubmit={handleSave}>

        {/* Announcement */}
        <div className={hStyles.card}>
          <h2 className={hStyles.cardTitle}>Announcement Bar</h2>
          <p className={hStyles.cardSub}>Shows a thin black banner at the very top of the site. Leave empty to hide it.</p>
          <label className={hStyles.label}>
            Message
            <input
              className={hStyles.input}
              value={settings.announcement}
              onChange={e => setSettings(s => ({ ...s, announcement: e.target.value }))}
              placeholder="Free shipping on orders over $75 · Use code LASHES10 for 10% off"
            />
          </label>
        </div>

        {/* Hero */}
        <div className={hStyles.card}>
          <h2 className={hStyles.cardTitle}>Hero Banner</h2>
          <p className={hStyles.cardSub}>The large full-screen section at the top of the homepage.</p>

          <div className={hStyles.grid}>
            <label className={hStyles.label}>
              Headline
              <input
                className={hStyles.input}
                value={settings.hero.title}
                onChange={e => setHero('title', e.target.value)}
                placeholder="The Art of Perfect Lashes"
              />
            </label>
            <label className={hStyles.label}>
              Subtext
              <input
                className={hStyles.input}
                value={settings.hero.subtitle}
                onChange={e => setHero('subtitle', e.target.value)}
                placeholder="Premium supplies, professional courses…"
              />
            </label>
          </div>

          <label className={hStyles.label}>
            Background Image URL
            <span className={hStyles.hint}>Paste any image URL — from Shopify, Google Drive, Dropbox, etc. Leave empty for black background.</span>
            <input
              className={hStyles.input}
              value={settings.hero.imageUrl}
              onChange={e => setHero('imageUrl', e.target.value)}
              placeholder="https://cdn.shopify.com/s/files/..."
            />
          </label>

          <label className={hStyles.label}>
            Background Video URL <span className={hStyles.hint}>(optional — overrides image if set)</span>
            <input
              className={hStyles.input}
              value={settings.hero.videoUrl}
              onChange={e => setHero('videoUrl', e.target.value)}
              placeholder="https://cdn.shopify.com/videos/..."
            />
          </label>

          <div className={hStyles.grid}>
            <label className={hStyles.label}>
              Primary Button Text
              <input className={hStyles.input} value={settings.hero.ctaPrimary.text} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, ctaPrimary: { ...s.hero.ctaPrimary, text: e.target.value } } }))} placeholder="Shop Now" />
            </label>
            <label className={hStyles.label}>
              Primary Button Link
              <input className={hStyles.input} value={settings.hero.ctaPrimary.href} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, ctaPrimary: { ...s.hero.ctaPrimary, href: e.target.value } } }))} placeholder="/shop" />
            </label>
            <label className={hStyles.label}>
              Secondary Button Text
              <input className={hStyles.input} value={settings.hero.ctaSecondary.text} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, ctaSecondary: { ...s.hero.ctaSecondary, text: e.target.value } } }))} placeholder="Our Courses" />
            </label>
            <label className={hStyles.label}>
              Secondary Button Link
              <input className={hStyles.input} value={settings.hero.ctaSecondary.href} onChange={e => setSettings(s => ({ ...s, hero: { ...s.hero, ctaSecondary: { ...s.hero.ctaSecondary, href: e.target.value } } }))} placeholder="/academy" />
            </label>
          </div>

          {/* Preview */}
          {settings.hero.imageUrl && (
            <div className={hStyles.preview} style={{ backgroundImage: `url(${settings.hero.imageUrl})` }}>
              <div className={hStyles.previewOverlay} />
              <div className={hStyles.previewContent}>
                <p className={hStyles.previewTitle}>{settings.hero.title || 'Hero Title'}</p>
                <p className={hStyles.previewSub}>{settings.hero.subtitle}</p>
              </div>
            </div>
          )}
        </div>

        <div className={hStyles.footer}>
          <button type="submit" className={hStyles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
