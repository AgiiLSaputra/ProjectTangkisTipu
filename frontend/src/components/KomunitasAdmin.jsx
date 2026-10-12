import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../api'
import AdminShell from './AdminShell.jsx'

export default function KomunitasAdmin({ onKeluar = () => {}, onNavigate = () => {}, onUnauthorized = () => {} }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, admin, participant
  const [searchQuery, setSearchQuery] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [selectedTag, setSelectedTag] = useState('Umum')
  const [postContent, setPostContent] = useState('')
  const [toast, setToast] = useState('')

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

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadPosts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      
      const response = await fetch(`${API_BASE_URL}/community/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
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

  useEffect(() => {
    loadPosts()
  }, [searchQuery])

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      showToast('Konten tidak boleh kosong')
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/community/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postContent.trim(),
          tag: selectedTag,
        }),
      })

      if (response.ok) {
        showToast('Postingan berhasil dibagikan!')
        setPostContent('')
        setSelectedTag('Umum')
        setShowComposer(false)
        loadPosts()
      } else {
        showToast('Gagal membuat postingan')
      }
    } catch (err) {
      console.error('Failed to create post:', err)
      showToast('Gagal membuat postingan')
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Yakin ingin menghapus postingan ini?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/community/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        showToast('Postingan berhasil dihapus')
        loadPosts()
      } else {
        showToast('Gagal menghapus postingan')
      }
    } catch (err) {
      console.error('Failed to delete post:', err)
      showToast('Gagal menghapus postingan')
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'admin') return post.author.type === 'admin'
    if (filter === 'participant') return post.author.type === 'participant'
    return true
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'baru saja'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}j`
    if (diff < 604800) return `${Math.floor(diff / 86400)}h`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  return (
    <AdminShell active="komunitas" onKeluar={onKeluar} onNavigate={onNavigate}>
      <div className="min-h-screen bg-surface-cream p-4 sm:p-6 lg:p-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-20 right-4 z-50 bg-surface-white rounded-xl shadow-xl p-4 flex items-center gap-3 pop-in">
            <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
            <span className="font-label-md text-on-surface">{toast}</span>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-display text-primary mb-2">Komunitas</h1>
            <p className="font-body-md text-text-muted">Kelola postingan komunitas TangkisTipu</p>
          </div>

        {/* Actions Bar */}
        <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari postingan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle bg-surface-container-low focus:outline-none focus:border-primary font-body-md text-on-surface placeholder:text-text-muted"
              />
            </div>
            
            <button
              onClick={() => setShowComposer(!showComposer)}
              className="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Buat Postingan</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border-subtle/60">
            {[
              { id: 'all', label: 'Semua', icon: 'list' },
              { id: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
              { id: 'participant', label: 'Peserta', icon: 'people' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-sm font-semibold transition-colors ${
                  filter === tab.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-text-muted hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        {showComposer && (
          <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-sm p-5 mb-6 pop-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-label-md text-on-surface font-semibold">Admin</span>
                  <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                </div>
                <span className="text-[11px] text-text-muted">Posting sebagai admin (dengan centang biru)</span>
              </div>
            </div>

            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Bagikan kode kelas, edukasi modus baru, atau tips keamanan..."
              rows={5}
              maxLength={2000}
              className="w-full resize-none outline-none bg-transparent font-body-md text-on-surface placeholder:text-text-muted mb-2"
            />
            <div className="text-[11px] text-text-muted text-right mb-3">{postContent.length}/2000</div>

            {/* Tag Selection */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              <span className="material-symbols-outlined text-[18px] text-text-muted shrink-0">sell</span>
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(t)}
                  className={`shrink-0 h-7 px-3 rounded-full font-label-sm font-semibold transition-colors ${
                    selectedTag === t
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-text-muted hover:bg-surface-container'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle/60">
              <button
                onClick={() => {
                  setShowComposer(false)
                  setPostContent('')
                  setSelectedTag('Umum')
                }}
                className="h-10 px-4 rounded-full bg-surface-container-low text-on-surface font-label-md font-semibold hover:bg-surface-container transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!postContent.trim()}
                className={`h-10 px-5 rounded-full font-label-md font-semibold transition-colors ${
                  postContent.trim()
                    ? 'bg-primary text-on-primary hover:bg-primary-container shadow-sm'
                    : 'bg-surface-container text-text-muted cursor-not-allowed'
                }`}
              >
                Posting
              </button>
            </div>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-surface-white rounded-2xl border border-border-subtle shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-text-muted mx-auto mb-3">
              <span className="material-symbols-outlined text-[28px]">forum</span>
            </div>
            <h3 className="font-headline-sm text-on-surface font-bold mb-2">Belum ada postingan</h3>
            <p className="font-body-sm text-text-muted mb-4">
              {filter === 'admin' ? 'Belum ada postingan dari admin' :
               filter === 'participant' ? 'Belum ada postingan dari peserta' :
               'Mulai berbagi konten edukasi dengan komunitas'}
            </p>
            <button
              onClick={() => setShowComposer(true)}
              className="h-10 px-5 rounded-full bg-primary text-on-primary font-label-md font-semibold hover:bg-primary-container transition-colors"
            >
              Buat Postingan
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredPosts.map(post => (
              <article key={post.id} className="bg-surface-white rounded-2xl border border-border-subtle shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 font-bold text-[14px]">
                    {post.author.type === 'admin' ? 
                      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span> :
                      post.author.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-label-md text-on-surface font-semibold">{post.author.name}</span>
                      {post.author.verified && (
                        <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                      )}
                      <span className="text-[12px] text-text-muted">{post.author.handle}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-[12px] text-text-muted">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 rounded-lg hover:bg-danger-red-light text-text-muted hover:text-danger-red transition-colors"
                    title="Hapus postingan"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                {post.tag && post.tag !== 'Umum' && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-low text-text-muted text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[12px]">sell</span>
                      {post.tag}
                    </span>
                  </div>
                )}

                <p className="font-body-md text-on-surface mb-3 whitespace-pre-line break-words">{post.content}</p>

                <div className="flex items-center gap-4 text-[12px] text-text-muted">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                    <span>{post.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    <span>{post.comments_count}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        </div>
      </div>
    </AdminShell>
  )
}
