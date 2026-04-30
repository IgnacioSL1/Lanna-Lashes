'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import styles from './auth.module.css';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirect = searchParams.get('redirect') ?? '/profile';

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, router, redirect]);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signin') {
        await signIn(form.email, form.password);
      } else {
        if (!form.firstName || !form.lastName) { setError('Please enter your full name.'); return; }
        await signUp(form.email, form.password, form.firstName, form.lastName);
      }
      router.replace(redirect);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoMark}>LL</span>
          <span className={styles.logoText}>LANNA LASHES</span>
        </div>

        <h1 className={styles.heading}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className={styles.sub}>
          {mode === 'signin'
            ? 'Sign in to access your courses and community.'
            : 'Join thousands of lash artists on their journey.'}
        </p>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'signin' ? styles.tabActive : ''}`}
            onClick={() => { setMode('signin'); setError(''); }}
          >Sign In</button>
          <button
            className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >Create Account</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>First Name</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Jane"
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Last Name</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            className={styles.switchBtn}
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
