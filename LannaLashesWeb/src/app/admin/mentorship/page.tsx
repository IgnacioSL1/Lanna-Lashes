'use client';
import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import styles from './page.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Video {
  id: string; title: string; description: string;
  videoUrl: string; thumbnail: string | null;
  duration: number; published: boolean; publishedAt: string | null;
}

interface Call {
  id: string; title: string; description: string | null;
  scheduledAt: string; meetUrl: string | null; recordingUrl: string | null;
  duration: number; isCompleted: boolean;
}

interface Member {
  id: string; plan: string; status: string;
  currentPeriodEnd: string; cancelAtPeriodEnd: boolean; createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PLAN_LABELS: Record<string, string> = { monthly: 'Monthly', biannual: '6-Month', annual: 'Annual' };
const STATUS_COLORS: Record<string, string> = {
  active: '#0f7a4b', past_due: '#b45309', canceled: '#6b7280', trialing: '#1d4ed8',
};

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'videos' | 'calls' | 'members';

export default function AdminMentorship() {
  const [tab, setTab]         = useState<Tab>('videos');
  const [videos, setVideos]   = useState<Video[]>([]);
  const [calls, setCalls]     = useState<Call[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<Video[]>('/api/mentorship/admin/videos'),
      apiGet<Call[]>('/api/mentorship/admin/calls'),
      apiGet<Member[]>('/api/mentorship/admin/members'),
    ]).then(([v, c, m]) => { setVideos(v); setCalls(c); setMembers(m); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Blueprint</h1>
      </div>
      <div className={styles.skelBody}>
        {[1,2,3,4].map(i => <div key={i} className={`skeleton ${styles.skel}`} />)}
      </div>
    </div>
  );

  const activeMembers = members.filter(m => m.status === 'active');

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Blueprint</h1>
          <p className={styles.pageSub}>Manage mentorship content and members</p>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statChip}>
            <span className={styles.statChipValue}>{activeMembers.length}</span>
            <span className={styles.statChipLabel}>Active Members</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statChipValue}>{videos.filter(v => v.published).length}</span>
            <span className={styles.statChipLabel}>Published Videos</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statChipValue}>{calls.filter(c => !c.isCompleted).length}</span>
            <span className={styles.statChipLabel}>Upcoming Calls</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'videos' ? styles.tabActive : ''}`} onClick={() => setTab('videos')}>
          Videos <span className={styles.tabCount}>{videos.length}</span>
        </button>
        <button className={`${styles.tab} ${tab === 'calls' ? styles.tabActive : ''}`} onClick={() => setTab('calls')}>
          Calls <span className={styles.tabCount}>{calls.length}</span>
        </button>
        <button className={`${styles.tab} ${tab === 'members' ? styles.tabActive : ''}`} onClick={() => setTab('members')}>
          Members <span className={styles.tabCount}>{members.length}</span>
        </button>
      </div>

      <div className={styles.tabBody}>
        {tab === 'videos' && (
          <VideosTab videos={videos} setVideos={setVideos} />
        )}
        {tab === 'calls' && (
          <CallsTab calls={calls} setCalls={setCalls} />
        )}
        {tab === 'members' && (
          <MembersTab members={members} />
        )}
      </div>
    </div>
  );
}

// ── Videos Tab ────────────────────────────────────────────────────────────────

function VideosTab({ videos, setVideos }: { videos: Video[]; setVideos: (v: Video[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Video | null>(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', videoUrl: '', thumbnail: '', duration: '',
  });

  function openNew() {
    setForm({ title: '', description: '', videoUrl: '', thumbnail: '', duration: '' });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(v: Video) {
    setForm({
      title: v.title, description: v.description, videoUrl: v.videoUrl,
      thumbnail: v.thumbnail ?? '', duration: String(v.duration),
    });
    setEditing(v);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.videoUrl) return;
    setSaving(true);
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        videoUrl:    form.videoUrl,
        thumbnail:   form.thumbnail || null,
        duration:    parseInt(form.duration) || 0,
      };
      if (editing) {
        const updated = await apiPut<Video>(`/api/mentorship/videos/${editing.id}`, payload);
        setVideos(videos.map(v => v.id === updated.id ? updated : v));
      } else {
        const created = await apiPost<Video>('/api/mentorship/videos', payload);
        setVideos([created, ...videos]);
      }
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this video? This cannot be undone.')) return;
    await apiDelete(`/api/mentorship/videos/${id}`);
    setVideos(videos.filter(v => v.id !== id));
  }

  async function togglePublish(v: Video) {
    const updated = await apiPut<Video>(`/api/mentorship/videos/${v.id}`, { published: !v.published });
    setVideos(videos.map(x => x.id === updated.id ? updated : x));
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionTitle}>Weekly Videos</p>
        <button className={styles.addBtn} onClick={openNew}>+ Add Video</button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.formHeader}>
            <p className={styles.formTitle}>{editing ? 'Edit Video' : 'New Video'}</p>
            <button type="button" className={styles.formClose} onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.formLabel}>
              Title *
              <input className={styles.formInput} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Week 12 — Pricing Your Way to Freedom" required />
            </label>
            <label className={styles.formLabel}>
              Duration (minutes)
              <input className={styles.formInput} type="number" value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} placeholder="45" min="0" />
            </label>
          </div>
          <label className={styles.formLabel}>
            Video URL * <span className={styles.formHint}>(Mux, Vimeo, or direct URL)</span>
            <input className={styles.formInput} value={form.videoUrl} onChange={e => setForm(f => ({...f, videoUrl: e.target.value}))} placeholder="https://stream.mux.com/..." required />
          </label>
          <label className={styles.formLabel}>
            Thumbnail URL <span className={styles.formHint}>(optional)</span>
            <input className={styles.formInput} value={form.thumbnail} onChange={e => setForm(f => ({...f, thumbnail: e.target.value}))} placeholder="https://..." />
          </label>
          <label className={styles.formLabel}>
            Description
            <textarea className={styles.formTextarea} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What members will learn in this video…" rows={3} />
          </label>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Publish Video'}
            </button>
          </div>
        </form>
      )}

      {videos.length === 0 ? (
        <div className={styles.empty}>No videos yet. Add your first one above.</div>
      ) : (
        <div className={styles.list}>
          {videos.map(v => (
            <div key={v.id} className={styles.row}>
              <div className={styles.rowThumb}>
                {v.thumbnail
                  ? <img src={v.thumbnail} alt={v.title} className={styles.thumbImg} />
                  : <span className={styles.thumbLL}>LL</span>
                }
              </div>
              <div className={styles.rowInfo}>
                <p className={styles.rowTitle}>{v.title}</p>
                <p className={styles.rowMeta}>
                  {v.duration ? `${v.duration}m` : '—'}
                  {v.publishedAt && ` · ${fmtDate(v.publishedAt)}`}
                </p>
              </div>
              <div className={styles.rowActions}>
                <button
                  className={`${styles.badge} ${v.published ? styles.badgeGreen : styles.badgeGray}`}
                  onClick={() => togglePublish(v)}
                  title="Click to toggle visibility"
                >
                  {v.published ? 'Published' : 'Draft'}
                </button>
                <button className={styles.rowBtn} onClick={() => openEdit(v)}>Edit</button>
                <button className={styles.rowBtnDanger} onClick={() => handleDelete(v.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Calls Tab ─────────────────────────────────────────────────────────────────

function CallsTab({ calls, setCalls }: { calls: Call[]; setCalls: (c: Call[]) => void }) {
  const [showForm, setShowForm]   = useState(false);
  const [editCall, setEditCall]   = useState<Call | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', scheduledAt: '', meetUrl: '', recordingUrl: '', duration: '60',
  });

  function openNew() {
    setForm({ title: '', description: '', scheduledAt: '', meetUrl: '', recordingUrl: '', duration: '60' });
    setEditCall(null);
    setShowForm(true);
  }

  function openEdit(c: Call) {
    setForm({
      title:        c.title,
      description:  c.description ?? '',
      scheduledAt:  toLocalInput(c.scheduledAt),
      meetUrl:      c.meetUrl ?? '',
      recordingUrl: c.recordingUrl ?? '',
      duration:     String(c.duration),
    });
    setEditCall(c);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) return;
    setSaving(true);
    try {
      const payload = {
        title:        form.title,
        description:  form.description || null,
        scheduledAt:  new Date(form.scheduledAt).toISOString(),
        meetUrl:      form.meetUrl || null,
        recordingUrl: form.recordingUrl || null,
        duration:     parseInt(form.duration) || 60,
      };
      if (editCall) {
        const updated = await apiPut<Call>(`/api/mentorship/calls/${editCall.id}`, payload);
        setCalls(calls.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await apiPost<Call>('/api/mentorship/calls', payload);
        setCalls([created, ...calls]);
      }
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(c: Call) {
    const updated = await apiPut<Call>(`/api/mentorship/calls/${c.id}`, { isCompleted: !c.isCompleted });
    setCalls(calls.map(x => x.id === updated.id ? updated : x));
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this call?')) return;
    await apiDelete(`/api/mentorship/calls/${id}`);
    setCalls(calls.filter(c => c.id !== id));
  }

  const upcoming = calls.filter(c => !c.isCompleted);
  const past     = calls.filter(c => c.isCompleted);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionTitle}>Monthly Calls</p>
        <button className={styles.addBtn} onClick={openNew}>+ Schedule Call</button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.formHeader}>
            <p className={styles.formTitle}>{editCall ? 'Edit Call' : 'Schedule a Call'}</p>
            <button type="button" className={styles.formClose} onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.formLabel}>
              Title *
              <input className={styles.formInput} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="May Q&A — Growth & Retention" required />
            </label>
            <label className={styles.formLabel}>
              Duration (minutes)
              <input className={styles.formInput} type="number" value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} min="1" />
            </label>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.formLabel}>
              Date & Time *
              <input className={styles.formInput} type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))} required />
            </label>
            <label className={styles.formLabel}>
              Google Meet URL
              <input className={styles.formInput} value={form.meetUrl} onChange={e => setForm(f => ({...f, meetUrl: e.target.value}))} placeholder="https://meet.google.com/..." />
            </label>
          </div>
          <label className={styles.formLabel}>
            Recording URL <span className={styles.formHint}>(add after the call)</span>
            <input className={styles.formInput} value={form.recordingUrl} onChange={e => setForm(f => ({...f, recordingUrl: e.target.value}))} placeholder="https://..." />
          </label>
          <label className={styles.formLabel}>
            Description <span className={styles.formHint}>(optional — shown to members)</span>
            <textarea className={styles.formTextarea} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Topics we'll cover this month…" rows={3} />
          </label>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving…' : editCall ? 'Save Changes' : 'Schedule'}
            </button>
          </div>
        </form>
      )}

      {calls.length === 0 ? (
        <div className={styles.empty}>No calls scheduled yet.</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className={styles.callGroup}>
              <p className={styles.callGroupLabel}>Upcoming</p>
              {upcoming.map(c => <CallRow key={c.id} call={c} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleComplete} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className={styles.callGroup}>
              <p className={styles.callGroupLabel}>Past</p>
              {past.map(c => <CallRow key={c.id} call={c} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleComplete} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CallRow({ call, onEdit, onDelete, onToggle }: {
  call: Call;
  onEdit: (c: Call) => void;
  onDelete: (id: string) => void;
  onToggle: (c: Call) => void;
}) {
  return (
    <div className={`${styles.row} ${call.isCompleted ? styles.rowDim : ''}`}>
      <div className={styles.callDateBlock}>
        <p className={styles.callDateDay}>{new Date(call.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        <p className={styles.callDateYear}>{new Date(call.scheduledAt).getFullYear()}</p>
      </div>
      <div className={styles.rowInfo}>
        <p className={styles.rowTitle}>{call.title}</p>
        <p className={styles.rowMeta}>
          {new Date(call.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          {' · '}{call.duration}m
          {call.meetUrl && <> · <a href={call.meetUrl} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>Meet link</a></>}
          {call.recordingUrl && <> · <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>Recording</a></>}
        </p>
      </div>
      <div className={styles.rowActions}>
        <button
          className={`${styles.badge} ${call.isCompleted ? styles.badgeGray : styles.badgeGreen}`}
          onClick={() => onToggle(call)}
          title="Click to toggle"
        >
          {call.isCompleted ? 'Completed' : 'Upcoming'}
        </button>
        <button className={styles.rowBtn} onClick={() => onEdit(call)}>Edit</button>
        <button className={styles.rowBtnDanger} onClick={() => onDelete(call.id)}>Delete</button>
      </div>
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MembersTab({ members }: { members: Member[] }) {
  const [search, setSearch] = useState('');

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return !q
      || m.user.firstName.toLowerCase().includes(q)
      || m.user.lastName.toLowerCase().includes(q)
      || m.user.email.toLowerCase().includes(q);
  });

  const revenue = {
    monthly:  members.filter(m => m.plan === 'monthly'  && m.status === 'active').length * 87,
    biannual: members.filter(m => m.plan === 'biannual' && m.status === 'active').length * 72.5,
    annual:   members.filter(m => m.plan === 'annual'   && m.status === 'active').length * 72.5,
  };
  const mrr = revenue.monthly + revenue.biannual + revenue.annual;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionTitle}>Members</p>
          <p className={styles.mrrLine}>~${mrr.toFixed(0)}/mo MRR from {members.filter(m => m.status === 'active').length} active subscribers</p>
        </div>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.memberTable}>
        <div className={styles.memberTableHead}>
          <span>Member</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Renews / Expires</span>
          <span>Joined</span>
        </div>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No members found.</div>
        ) : (
          filtered.map(m => (
            <div key={m.id} className={styles.memberRow}>
              <div className={styles.memberInfo}>
                <div className={styles.memberAvatar}>
                  {m.user.firstName[0]}{m.user.lastName[0]}
                </div>
                <div>
                  <p className={styles.memberName}>{m.user.firstName} {m.user.lastName}</p>
                  <p className={styles.memberEmail}>{m.user.email}</p>
                </div>
              </div>
              <span className={styles.memberPlan}>{PLAN_LABELS[m.plan] ?? m.plan}</span>
              <span
                className={styles.memberStatus}
                style={{ color: STATUS_COLORS[m.status] ?? '#6b7280' }}
              >
                {m.status}
                {m.cancelAtPeriodEnd && ' · canceling'}
              </span>
              <span className={styles.memberDate}>{fmtDate(m.currentPeriodEnd)}</span>
              <span className={styles.memberDate}>{fmtDate(m.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
