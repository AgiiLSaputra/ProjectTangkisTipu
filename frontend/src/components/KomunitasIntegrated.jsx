import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../api'

// ============================================================
// TAG OPTIONS
// ============================================================

const TRENDING = [
  'Curhat Korban',
  'Modus Baru',
  'Tips Aman',
  'Edukasi',
  'APK Palsu',
  'Phishing & OTP',
]

const TAG_OPTIONS = [
  'Umum',
  'Curhat Korban',
  'Modus Baru',
  'Tips Aman',
  'Edukasi',
  'Pinjol Ilegal',
  'APK Palsu',
  'Phishing & OTP',
  'Investasi Bodong',
  'Penipuan Online Shop',
]

// ============================================================
// HELPERS
// ============================================================

function getAvatarInitial(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`
  if (diff < 604800) return `${Math.floor(diff / 86400)}h`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function SidebarNav({ active, onChange }) {
  const items = [
    { id: 'upload', label: 'Upload', icon: 'add_circle', desc: 'Bagikan cerita atau tips' },
    { id: 'explore', label: 'Explore', icon: 'explore', desc: 'Jelajahi cerita & edukasi' },
    { id: 'markah', label: 'Markah', icon: 'bookmark', desc: 'Postingan yang kamu simpan' },
  ]

  return (
    <nav
      className="bg-surface-white rounded-2xl border border-border-subtle shadow-sm p-2 flex flex-col gap-1"
      aria-label="Navigasi komunitas"
    >
      {items.map((it) => {
        const isActive = active === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
              isActive
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface hover:bg-surface-container-low'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="material-symbols-outlined text-[22px] shrink-0">{it.icon}</span>
            <span className="flex flex-col min-w-0">
              <span className={`font-label-md text-label-md font-semibold ${isActive ? 'text-on-primary' : 'text-on-surface'}`}>
                {it.label}
              </span>
              <span className={`text-[11px] ${isActive ? 'text-on-primary/80' : 'text-text-muted'}`}>
                {it.desc}
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}

function MobileBottomNav({ active, onChange }) {
  const items = [
    { id: 'upload', label: 'Upload', icon: 'add_circle' },
    { id: 'explore', label: 'Explore', icon: 'explore' },
    { id: 'markah', label: 'Markah', icon: 'bookmark' },
  ]

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-white border-t border-border-subtle shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-label="Navigasi komunitas mobile"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {items.map((it) => {
          const isActive = active === it.id
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange(it.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-w-[64px] transition-colors"
              aria-current={isActive ? 'page' : undefined}
              aria-label={it.label}
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {it.icon}
              </span>
              <span
                className={`font-label-sm text-[11px] transition-colors ${
                  isActive ? 'text-primary font-bold' : 'text-text-muted font-semibold'
                }`}
              >
                {it.label}
              </span>
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function MobileTrendingChips({ activeTag, onSelectTag }) {
  return (
    <div className="lg:hidden bg-surface-white rounded-2xl border border-border-subtle shadow-sm p-3 pop-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
          <span className="font-label-sm text-label-sm text-on-surface font-bold">Trending Modus</span>
        </div>
        {activeTag && (
          <button
            type="button"
            onClick={() => onSelectTag(activeTag)}
            className="text-[11px] text-primary font-semibold hover:underline"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {TRENDING.map((tag) => {
          const isActive = activeTag === tag
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onSelectTag(tag)}
              className={`shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-text-muted hover:bg-surface-container'
              }`}
              aria-pressed={isActive}
            >
              <span className="material-symbols-outlined text-[14px]">sell</span>
              <span>{tag}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MobileInfoPanel() {
  return (
    <div className="lg:hidden bg-surface-card-subtle rounded-2xl border border-border-subtle p-4 pop-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
        <span className="font-label-md text-label-md text-on-surface font-bold">Etika Berbagi</span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-text-muted">
        <li className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5 shrink-0">check_circle</span>
          <span>Cerita pengalaman pribadi, bukan rumor.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5 shrink-0">check_circle</span>
          <span>Sensor data pribadi & nomor rekening.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5 shrink-0">check_circle</span>
          <span>Dukung korban, jangan menghakimi.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-danger-red mt-0.5 shrink-0">cancel</span>
          <span>Tanpa ujaran kebencian atau spam.</span>
        </li>
      </ul>
    </div>
  )
}

function Composer({ participantToken, onSubmit, onToast }) {
  const [text, setText] = useState('')
  const [tag, setTag] = useState('Umum')
  const [submitting, setSubmitting] = useState(false)

  const canPost = text.trim().length > 0

  const submit = async () => {
    if (!canPost || submitting) return
    
    setSubmitting(true)
    try {
      await onSubmit({ content: text.trim(), tag })
      setText('')
      setTag('Umum')
      onToast('Postingan berhasil dibagikan!')
    } catch (err) {
      onToast('Gagal membuat postingan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface-white border border-border-subtle shadow-sm pop-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-label-md text-label-md text-on-surface font-semibold">Bagikan cerita atau edukasimu</span>
          <span className="text-[11px] text-text-muted">Curhat korban · Modus baru · Tips aman</span>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ceritakan pengalamanmu, modus yang kamu temui, atau tips agar orang lain tidak tertipu..."
        rows={4}
        maxLength={2000}
        className="w-full resize-none outline-none bg-transparent font-body-md text-body-md text-on-surface placeholder:text-text-muted mb-2"
      />
      <div className="text-[11px] text-text-muted text-right mb-2">{text.length}/2000</div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
        <span className="material-symbols-outlined text-[18px] text-text-muted shrink-0">sell</span>
        {TAG_OPTIONS.map((t) => {
          const isActive = tag === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={`shrink-0 h-7 px-3 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-text-muted hover:bg-surface-container'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border-subtle/60">
        <div className="text-[11px] text-text-muted">
          {participantToken ? 'Posting sebagai peserta' : 'Perlu login untuk posting'}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!canPost || !participantToken || submitting}
          className={`h-10 px-5 rounded-full font-label-md text-label-md font-semibold transition-colors ${
            canPost && participantToken && !submitting
              ? 'bg-primary text-on-primary hover:bg-primary-container shadow-sm'
              : 'bg-surface-container text-text-muted cursor-not-allowed'
          }`}
        >
          {submitting ? 'Memposting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}

function PostCard({ post, participantToken, onLike, onBookmark, onDelete, onToast }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLike = async () => {
    try {
      await onLike(post.id)
    } catch (err) {
      onToast('Gagal memberikan like')
    }
  }

  const handleBookmark = async () => {
    try {
      await onBookmark(post.id)
    } catch (err) {
      onToast('Gagal menyimpan bookmark')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Yakin ingin menghapus postingan ini?')) return
    try {
      await onDelete(post.id)
      onToast('Postingan berhasil dihapus')
    } catch (err) {
      onToast('Gagal menghapus postingan')
    }
  }

  const isOwn = post.author.type === 'participant' // Simplified - seharusnya check user ID

  return (
    <article className="p-4 rounded-2xl bg-surface-white border border-border-subtle shadow-sm hover:shadow-md transition-shadow pop-in">
      <header className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 font-bold text-[14px]">
          {post.author.type === 'admin' ? (
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          ) : (
            getAvatarInitial(post.author.name)
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-label-md text-label-md text-on-surface font-semibold truncate">{post.author.name}</span>
            {post.author.verified && (
              <span className="material-symbols-outlined text-[14px] text-primary shrink-0" aria-label="Terverifikasi">verified</span>
            )}
            <span className="text-[12px] text-text-muted truncate">{post.author.handle}</span>
            <span className="text-text-muted">·</span>
            <span className="text-[12px] text-text-muted whitespace-nowrap">{formatTime(post.created_at)}</span>
          </div>
        </div>

        {isOwn && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                menuOpen ? 'bg-surface-container text-primary' : 'hover:bg-surface-container-low text-text-muted'
              }`}
              aria-label="Menu postingan"
            >
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-surface-white border border-border-subtle rounded-xl shadow-xl min-w-[200px] overflow-hidden pop-in">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-3.5 hover:bg-danger-red-light text-danger-red font-label-sm text-label-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Hapus Postingan
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {post.tag && post.tag !== 'Umum' && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-low text-text-muted text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[12px]">sell</span>
            {post.tag}
          </span>
        </div>
      )}

      <p className="font-body-md text-body-md text-on-surface mb-3 whitespace-pre-line break-words">{post.content}</p>

      {post.image_url && (
        <div className="rounded-xl overflow-hidden mb-3 bg-surface-container max-h-[420px]">
          <img src={post.image_url} alt="" className="w-full h-auto object-cover" loading="lazy" />
        </div>
      )}

      <footer className="flex items-center justify-around pt-3 border-t border-border-subtle/60">
        <button
          type="button"
          onClick={handleLike}
          disabled={!participantToken}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
            post.user_liked
              ? 'text-danger-red bg-danger-red-light'
              : 'text-text-muted hover:bg-surface-container-low hover:text-danger-red'
          } ${!participantToken ? 'cursor-not-allowed opacity-50' : ''}`}
          aria-label={post.user_liked ? 'Batal suka' : 'Suka'}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: post.user_liked ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
          <span className="text-[12px] font-semibold">{post.likes_count}</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-text-muted hover:bg-surface-container-low hover:text-primary"
          aria-label="Komentar"
        >
          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
          <span className="text-[12px] font-semibold">{post.comments_count}</span>
        </button>

        <button
          type="button"
          onClick={handleBookmark}
          disabled={!participantToken}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            post.user_bookmarked
              ? 'text-primary bg-primary-fixed shadow-sm'
              : 'text-text-muted hover:bg-surface-container-low hover:text-primary'
          } ${!participantToken ? 'cursor-not-allowed opacity-50' : ''}`}
          aria-label={post.user_bookmarked ? 'Hapus dari markah' : 'Simpan ke markah'}
          aria-pressed={post.user_bookmarked}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: post.user_bookmarked ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
        </button>
      </footer>
    </article>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="p-8 sm:p-10 rounded-2xl bg-surface-white border border-border-subtle shadow-sm flex flex-col items-center text-center gap-3 pop-in">
      <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-text-muted">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">{title}</h4>
      <p className="font-body-sm text-body-sm text-text-muted max-w-sm">{desc}</p>
    </div>
  )
}

function TrendsPanel({ activeTag, onSelectTag }) {
  return (
    <div className="p-4 rounded-2xl bg-surface-white border border-border-subtle shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="font-label-md text-label-md text-on-surface font-bold">Trending Modus</span>
        <span className="material-symbols-outlined text-[18px] text-text-muted">trending_up</span>
      </div>
      <ul className="flex flex-col gap-1">
        {TRENDING.map((tag) => {
          const isActive = activeTag === tag
          return (
            <li key={tag}>
              <button
                type="button"
                onClick={() => onSelectTag(tag)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'hover:bg-surface-container-low'
                }`}
                aria-pressed={isActive}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[16px] shrink-0 ${
                      isActive ? 'text-on-primary' : 'text-primary'
                    }`}
                  >
                    sell
                  </span>
                  <span
                    className={`font-label-sm text-label-sm font-semibold truncate ${
                      isActive ? 'text-on-primary' : 'text-on-surface'
                    }`}
                  >
                    {tag}
                  </span>
                </span>
                <span
                  className={`material-symbols-outlined text-[16px] shrink-0 ${
                    isActive ? 'text-on-primary' : 'text-text-muted'
                  }`}
                >
                  {isActive ? 'check' : 'chevron_right'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[11px] text-text-muted leading-relaxed">
        Klik salah satu topik untuk melihat semua cerita dan tips terkait.
      </p>
    </div>
  )
}

function InfoPanel() {
  return (
    <div className="p-4 rounded-2xl bg-surface-card-subtle border border-border-subtle">
      <div className="flex items-center gap-2 mb-2 text-primary">
        <span className="material-symbols-outlined text-[20px]">shield</span>
        <span className="font-label-md text-label-md font-bold">Etika Berbagi</span>
      </div>
      <ul className="flex flex-col gap-1.5 text-[12px] text-text-muted">
        <li className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5 shrink-0">check_circle</span>
          <span>Cerita pengalaman pribadi, bukan rumor.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5 shrink-0">check_circle</span>
          <span>Sensor data pribadi & nomor rekening sebelum share.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5 shrink-0">check_circle</span>
          <span>Dukung korban, jangan menghakimi.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-danger-red mt-0.5 shrink-0">cancel</span>
          <span>Tanpa ujaran kebencian atau spam.</span>
        </li>
      </ul>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function KomunitasIntegrated({ participantToken = null }) {
  const [active, setActive] = useState('explore')
  const [posts, setPosts] = useState([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Load posts dari API
  const loadPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedTag) params.append('tag', selectedTag)
      if (search) params.append('search', search)
      
      const headers = {}
      if (participantToken) {
        headers['X-Participant-Token'] = participantToken
      }

      const response = await fetch(`${API_BASE_URL}/community/posts?${params}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (err) {
      console.error('Failed to load posts:', err)
      showToast('Gagal memuat postingan')
    } finally {
      setLoading(false)
    }
  }

  // Load bookmarks
  const loadBookmarks = async () => {
    if (!participantToken) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/community/bookmarks`, {
        headers: {
          'X-Participant-Token': participantToken,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setBookmarkedPosts(data.posts || [])
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
      showToast('Gagal memuat bookmark')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (active === 'explore') {
      loadPosts()
    } else if (active === 'markah') {
      loadBookmarks()
    }
  }, [active, selectedTag, search])

  // Create post
  const handleSubmitPost = async (payload) => {
    if (!participantToken) {
      showToast('Perlu login untuk posting')
      return
    }

    const response = await fetch(`${API_BASE_URL}/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Participant-Token': participantToken,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error('Failed to create post')
    
    setActive('explore')
    loadPosts()
  }

  // Toggle like
  const handleLike = async (postId) => {
    if (!participantToken) {
      showToast('Perlu login untuk memberikan like')
      return
    }

    const response = await fetch(`${API_BASE_URL}/community/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'X-Participant-Token': participantToken,
      },
    })

    if (!response.ok) throw new Error('Failed to like')
    
    loadPosts()
    if (active === 'markah') loadBookmarks()
  }

  // Toggle bookmark
  const handleBookmark = async (postId) => {
    if (!participantToken) {
      showToast('Perlu login untuk menyimpan bookmark')
      return
    }

    const response = await fetch(`${API_BASE_URL}/community/posts/${postId}/bookmark`, {
      method: 'POST',
      headers: {
        'X-Participant-Token': participantToken,
      },
    })

    if (!response.ok) throw new Error('Failed to bookmark')
    
    const data = await response.json()
    showToast(data.bookmarked ? 'Disimpan ke markah' : 'Dihapus dari markah')
    
    loadPosts()
    if (active === 'markah') loadBookmarks()
  }

  // Delete post
  const handleDelete = async (postId) => {
    if (!participantToken) return

    const response = await fetch(`${API_BASE_URL}/community/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'X-Participant-Token': participantToken,
      },
    })

    if (!response.ok) throw new Error('Failed to delete')
    
    loadPosts()
    if (active === 'markah') loadBookmarks()
  }

  const handleSelectTrending = (tag) => {
    setSelectedTag((prev) => (prev === tag ? null : tag))
    setSearch('')
    setActive('explore')
  }

  const feedPosts = active === 'markah' ? bookmarkedPosts : posts

  return (
    <main className="w-full bg-surface-cream min-h-screen">
      {toast && (
        <div
          className="fixed top-20 sm:top-24 right-3 left-3 sm:left-auto sm:right-6 z-[110] flex items-center gap-3 p-3 pr-4 bg-surface-white rounded-xl shadow-xl pop-in sm:max-w-[calc(100%-3rem)] sm:ml-auto"
          role="status"
          aria-live="polite"
        >
          <div className="w-9 h-9 rounded-full bg-safe-green-light flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <span className="font-label-md text-label-md text-on-surface">{toast}</span>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 sm:px-margin md:px-margin-tablet lg:px-margin-desktop pt-space-lg sm:pt-space-xl pb-28 lg:pb-space-xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-space-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-[26px] sm:text-[30px] lg:text-display text-primary tracking-tight leading-tight">
                Komunitas
              </h1>
              <p className="font-body-sm sm:font-body-md text-body-sm sm:text-body-md text-text-muted mt-0.5 sm:mt-1">
                Curhat korban, modus baru, dan edukasi anti-penipuan
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari cerita, modus, atau tips aman..."
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-border-subtle bg-surface-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-body-md text-on-surface placeholder:text-text-muted transition-all"
              disabled={active !== 'explore'}
            />
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-space-lg">
          {/* Sidebar kiri - Desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-space-lg flex flex-col gap-space-md">
              <SidebarNav active={active} onChange={setActive} />
              <TrendsPanel activeTag={selectedTag} onSelectTag={handleSelectTrending} />
            </div>
          </aside>

          {/* Content tengah */}
          <div className="flex flex-col gap-space-md">
            <MobileTrendingChips activeTag={selectedTag} onSelectTag={handleSelectTrending} />
            
            {active === 'upload' && (
              <Composer
                participantToken={participantToken}
                onSubmit={handleSubmitPost}
                onToast={showToast}
              />
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : feedPosts.length === 0 ? (
              <EmptyState
                icon={active === 'markah' ? 'bookmark' : 'forum'}
                title={active === 'markah' ? 'Belum ada yang disimpan' : 'Belum ada postingan'}
                desc={active === 'markah' ? 'Postingan yang kamu bookmark akan muncul di sini' : 'Jadilah yang pertama berbagi cerita atau tips'}
              />
            ) : (
              <div className="flex flex-col gap-space-md">
                {feedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    participantToken={participantToken}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onDelete={handleDelete}
                    onToast={showToast}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar kanan - Desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-space-lg">
              <InfoPanel />
            </div>
          </aside>
        </div>

        <MobileInfoPanel />
      </div>

      <MobileBottomNav active={active} onChange={setActive} />
    </main>
  )
}
