import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import '../styles/admin.css'

const TABS = [
	{ key: 'overview', icon: '📊', label: 'Overview' },
	{ key: 'users',    icon: '👥', label: 'Users' },
	{ key: 'posts',    icon: '📝', label: 'Posts' },
]

const fmt = (iso) => {
	if (!iso) return '—'
	return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const Donut = ({ public: pub, private: priv }) => {
	const total = pub + priv || 1
	const r = 40, circ = 2 * Math.PI * r
	const pubDash = (pub / total) * circ
	return (
		<div className="donut-wrap">
			<svg viewBox="0 0 100 100" width="140" height="140">
				<circle cx="50" cy="50" r={r} fill="none" stroke="#f0f0f0" strokeWidth="14"/>
				<circle cx="50" cy="50" r={r} fill="none" stroke="#1890ff" strokeWidth="14"
					strokeDasharray={`${pubDash} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)"/>
				<circle cx="50" cy="50" r={r} fill="none" stroke="#722ed1" strokeWidth="14"
					strokeDasharray={`${circ - pubDash} ${circ}`} strokeDashoffset={-pubDash}
					strokeLinecap="round" transform="rotate(-90 50 50)"/>
				<text x="50" y="46" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a1a1a">{pub + priv}</text>
				<text x="50" y="60" textAnchor="middle" fontSize="8" fill="#888">posts</text>
			</svg>
			<div className="donut-legend">
				<span className="legend-dot" style={{background:'#1890ff'}}/>
				<span>Public <strong>{Math.round((pub/total)*100)}%</strong></span>
				<span className="legend-dot" style={{background:'#722ed1'}}/>
				<span>Private <strong>{Math.round((priv/total)*100)}%</strong></span>
			</div>
		</div>
	)
}

const EditPostModal = ({ post, onClose, onSave }) => {
	const [content, setContent] = useState(post.content)
	const [visibility, setVisibility] = useState(post.visibility)
	const [existingMedia, setExistingMedia] = useState(post.media || [])
	const [newFiles, setNewFiles] = useState([]) // [{file, preview, type}]
	const [saving, setSaving] = useState(false)
	const [selectedMedia, setSelectedMedia] = useState(new Set()) // keys: `e-{id}` or `n-{idx}`

	const allMedia = [
		...existingMedia.map(m => ({ ...m, isNew: false, key: `e-${m.id}` })),
		...newFiles.map((m, i) => ({ id: `new-${i}`, url: m.preview, media_type: m.type, isNew: true, idx: i, key: `n-${i}` })),
	]

	const toggleMediaSelect = (key) => {
		setSelectedMedia(prev => {
			const s = new Set(prev)
			s.has(key) ? s.delete(key) : s.add(key)
			return s
		})
	}

	const toggleSelectAllMedia = () => {
		if (selectedMedia.size === allMedia.length) {
			setSelectedMedia(new Set())
		} else {
			setSelectedMedia(new Set(allMedia.map(m => m.key)))
		}
	}

	const removeSelected = () => {
		const toRemoveExisting = [...selectedMedia].filter(k => k.startsWith('e-')).map(k => parseInt(k.slice(2)))
		const toRemoveNewIdx = [...selectedMedia].filter(k => k.startsWith('n-')).map(k => parseInt(k.slice(2)))
		setExistingMedia(prev => prev.filter(m => !toRemoveExisting.includes(m.id)))
		setNewFiles(prev => prev.filter((_, i) => !toRemoveNewIdx.includes(i)))
		setSelectedMedia(new Set())
	}

	const handleAddFiles = (e, type) => {
		const files = Array.from(e.target.files)
		const items = files.map(f => ({ file: f, preview: URL.createObjectURL(f), type }))
		setNewFiles(prev => [...prev, ...items])
		e.target.value = ''
	}

	const removeSingle = (m) => {
		if (m.isNew) setNewFiles(prev => prev.filter((_, i) => i !== m.idx))
		else setExistingMedia(prev => prev.filter(x => x.id !== m.id))
		setSelectedMedia(prev => { const s = new Set(prev); s.delete(m.key); return s })
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			const fd = new FormData()
			fd.append('content', content)
			fd.append('visibility', visibility)
			const originalIds = (post.media || []).map(m => m.id)
			const keptIds = existingMedia.map(m => m.id)
			originalIds.filter(id => !keptIds.includes(id)).forEach(id => fd.append('remove_media_ids', id))
			newFiles.forEach(m => fd.append(m.type === 'image' ? 'images' : 'videos', m.file))
			const res = await api.patch(`/posts/${post.id}/`, fd)
			onSave(res.data)
			onClose()
		} catch { setSaving(false) }
	}

	const allSelected = allMedia.length > 0 && selectedMedia.size === allMedia.length
	const someSelected = selectedMedia.size > 0 && selectedMedia.size < allMedia.length

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-box" onClick={e => e.stopPropagation()}>
				<div className="modal-header">
					<div className="modal-header-info">
						<div className="modal-author-avatar">
							{post.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
						</div>
						<div>
							<strong>{post.author}</strong>
							<span className="modal-post-id">Post #{post.id}</span>
						</div>
					</div>
					<button className="modal-close" onClick={onClose}>✕</button>
				</div>

				<div className="modal-body">
					<label className="modal-label">Content</label>
					<textarea className="modal-textarea" value={content}
						onChange={e => setContent(e.target.value)} rows={4}
						placeholder="What's on your mind?"
					/>

					<label className="modal-label">Visibility</label>
					<select className="modal-select" value={visibility} onChange={e => setVisibility(e.target.value)}>
						<option value="public">🌍 Public — Everyone can see</option>
						<option value="private">🔒 Private — Only you can see</option>
					</select>

					<div className="modal-media-section">
						<div className="modal-media-header">
							<div className="modal-media-title-row">
								{allMedia.length > 0 && (
									<input type="checkbox" className="row-check"
										checked={allSelected}
										ref={el => { if (el) el.indeterminate = someSelected }}
										onChange={toggleSelectAllMedia}
									/>
								)}
								<label className="modal-label" style={{margin:0}}>Media ({allMedia.length})</label>
							</div>
							<div className="modal-add-media">
								{selectedMedia.size > 0 ? (
									<button className="modal-media-btn remove" onClick={removeSelected}>
										🗑 Remove {selectedMedia.size}
									</button>
								) : (
									<>
										<label className="modal-media-btn replace">
											+ Photo
											<input type="file" accept="image/*" multiple onChange={e => handleAddFiles(e, 'image')} hidden />
										</label>
										<label className="modal-media-btn replace">
											+ Video
											<input type="file" accept="video/*" multiple onChange={e => handleAddFiles(e, 'video')} hidden />
										</label>
									</>
								)}
							</div>
						</div>

						{allMedia.length === 0 ? (
							<div className="modal-no-media">No media attached</div>
						) : (
							<div className="modal-media-grid">
								{allMedia.map(m => (
									<div
										key={m.key}
										className={`modal-media-thumb ${m.isNew ? 'is-new' : ''} ${selectedMedia.has(m.key) ? 'is-selected' : ''}`}
										onClick={() => toggleMediaSelect(m.key)}
									>
										{m.media_type === 'video'
											? <video src={m.url} />
											: <img src={m.url} alt="" />}
										<input
											type="checkbox"
											className="media-thumb-check"
											checked={selectedMedia.has(m.key)}
											onChange={() => toggleMediaSelect(m.key)}
											onClick={e => e.stopPropagation()}
										/>
										{m.isNew && <span className="media-new-badge">New</span>}
										{!selectedMedia.has(m.key) && (
											<button className="modal-thumb-remove" onClick={e => { e.stopPropagation(); removeSingle(m) }}>✕</button>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="modal-footer">
					<button className="modal-cancel" onClick={onClose}>Cancel</button>
					<button className="modal-save" onClick={handleSave} disabled={saving}>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</div>
		</div>
	)
}

const AdminDashboard = () => {
	const { user } = useAuth()
	const navigate = useNavigate()
	const [stats, setStats] = useState(null)
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('overview')
	const [search, setSearch] = useState('')
	const [visFilter, setVisFilter] = useState('all')
	const [roleFilter, setRoleFilter] = useState('all')
	const [actionLoading, setActionLoading] = useState(null)
	const [toast, setToast] = useState(null)
	const [editPost, setEditPost] = useState(null)
	const [selectedPosts, setSelectedPosts] = useState(new Set())

	useEffect(() => {
		if (!user?.is_staff) { navigate('/feed'); return }
		api.get('/auth/admin/stats/')
			.then(res => { setStats(res.data); setLoading(false) })
			.catch(() => navigate('/feed'))
	}, [user, navigate])

	const showToast = (msg, type = 'success') => {
		setToast({ msg, type })
		setTimeout(() => setToast(null), 3000)
	}

	const handleDeleteUser = async (uid) => {
		if (!window.confirm('Delete this user and all their posts?')) return
		setActionLoading(`user-${uid}`)
		try {
			await api.delete(`/auth/admin/users/${uid}/delete/`)
			setStats(prev => ({
				...prev,
				total_users: prev.total_users - 1,
				users: prev.users.filter(u => u.id !== uid),
				recent_posts: prev.recent_posts.filter(p => p.author_id !== uid),
			}))
			showToast('User deleted successfully')
		} catch { showToast('Failed to delete user', 'error') }
		finally { setActionLoading(null) }
	}

	const handleToggleRole = async (uid) => {
		setActionLoading(`role-${uid}`)
		try {
			const res = await api.post(`/auth/admin/users/${uid}/toggle-role/`)
			setStats(prev => ({ ...prev, users: prev.users.map(u => u.id === uid ? res.data : u) }))
			showToast(`Role updated to ${res.data.is_staff ? 'Admin' : 'User'}`)
		} catch { showToast('Failed to update role', 'error') }
		finally { setActionLoading(null) }
	}

	const handleDeletePost = async (pid) => {
		if (!window.confirm('Delete this post?')) return
		setActionLoading(`post-${pid}`)
		try {
			await api.delete(`/posts/${pid}/`)
			setStats(prev => ({
				...prev,
				total_posts: prev.total_posts - 1,
				recent_posts: prev.recent_posts.filter(p => p.id !== pid),
			}))
			setSelectedPosts(prev => { const s = new Set(prev); s.delete(pid); return s })
			showToast('Post deleted successfully')
		} catch { showToast('Failed to delete post', 'error') }
		finally { setActionLoading(null) }
	}

	const handleBulkDelete = async () => {
		const ids = [...selectedPosts]
		if (!ids.length) return
		if (!window.confirm(`Delete ${ids.length} selected post${ids.length > 1 ? 's' : ''}?`)) return
		setActionLoading('bulk')
		try {
			await Promise.all(ids.map(id => api.delete(`/posts/${id}/`)))
			setStats(prev => ({
				...prev,
				total_posts: prev.total_posts - ids.length,
				recent_posts: prev.recent_posts.filter(p => !ids.includes(p.id)),
			}))
			setSelectedPosts(new Set())
			showToast(`${ids.length} post${ids.length > 1 ? 's' : ''} deleted`)
		} catch { showToast('Bulk delete failed', 'error') }
		finally { setActionLoading(null) }
	}

	const toggleSelectPost = (pid) => {
		setSelectedPosts(prev => {
			const s = new Set(prev)
			s.has(pid) ? s.delete(pid) : s.add(pid)
			return s
		})
	}

	const toggleSelectAll = () => {
		if (selectedPosts.size === filteredPosts.length) {
			setSelectedPosts(new Set())
		} else {
			setSelectedPosts(new Set(filteredPosts.map(p => p.id)))
		}
	}

	const handleToggleVisibility = async (pid, currentVis) => {
		setActionLoading(`vis-${pid}`)
		const newVis = currentVis === 'public' ? 'private' : 'public'
		try {
			await api.patch(`/posts/${pid}/`, { visibility: newVis })
			setStats(prev => ({
				...prev,
				public_posts: prev.public_posts + (newVis === 'public' ? 1 : -1),
				private_posts: prev.private_posts + (newVis === 'private' ? 1 : -1),
				recent_posts: prev.recent_posts.map(p => p.id === pid ? { ...p, visibility: newVis } : p),
			}))
			showToast(`Post set to ${newVis}`)
		} catch { showToast('Failed to update visibility', 'error') }
		finally { setActionLoading(null) }
	}

	const handleEditSave = (updatedPost) => {
		setStats(prev => ({
			...prev,
			recent_posts: prev.recent_posts.map(p =>
				p.id === updatedPost.id
					? { ...p, content: updatedPost.content?.slice(0, 80), visibility: updatedPost.visibility }
					: p
			),
		}))
		showToast('Post updated successfully')
	}

	const filteredUsers = useMemo(() => {
		if (!stats) return []
		const q = search.toLowerCase()
		return stats.users.filter(u => {
			const matchSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q)
			const matchRole = roleFilter === 'all' || (roleFilter === 'admin' ? u.is_staff : !u.is_staff)
			return matchSearch && matchRole
		})
	}, [stats, search, roleFilter])

	const filteredPosts = useMemo(() => {
		if (!stats) return []
		const q = search.toLowerCase()
		return stats.recent_posts.filter(p => {
			const matchSearch = `${p.author} ${p.author_email} ${p.content}`.toLowerCase().includes(q)
			const matchVis = visFilter === 'all' || p.visibility === visFilter
			return matchSearch && matchVis
		})
	}, [stats, search, visFilter])

	useEffect(() => { setSelectedPosts(new Set()) }, [search, visFilter, activeTab])

	if (loading) return (
		<div className="admin-loading">
			<div className="admin-spinner" />
			<span>Loading dashboard...</span>
		</div>
	)

	const statCards = [
		{ icon: '👥', value: stats.total_users,   label: 'Total Users',   color: '#1890ff' },
		{ icon: '📝', value: stats.total_posts,   label: 'Total Posts',   color: '#52c41a' },
		{ icon: '🌍', value: stats.public_posts,  label: 'Public Posts',  color: '#fa8c16' },
		{ icon: '🔒', value: stats.private_posts, label: 'Private Posts', color: '#722ed1' },
	]

	return (
		<div className="admin-wrap">
			<Navbar />
			{toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
			{editPost && <EditPostModal post={editPost} onClose={() => setEditPost(null)} onSave={handleEditSave} />}

			<div className="admin-layout">
				<aside className="admin-sidebar">
					<div className="admin-brand">
						<span className="admin-brand-icon">⚙️</span>
						<span>Admin Panel</span>
					</div>
					<nav className="admin-nav">
						{TABS.map(t => (
							<button key={t.key}
								className={`admin-nav-item ${activeTab === t.key ? 'active' : ''}`}
								onClick={() => { setActiveTab(t.key); setSearch(''); setVisFilter('all'); setRoleFilter('all') }}
							>
								<span className="nav-item-icon">{t.icon}</span>
								{t.label}
								{t.key === 'users' && <span className="nav-count">{stats.total_users}</span>}
								{t.key === 'posts' && <span className="nav-count">{stats.total_posts}</span>}
							</button>
						))}
					</nav>
					<div className="admin-sidebar-footer">
						<button className="back-to-feed" onClick={() => navigate('/feed')}>← Back to Feed</button>
					</div>
				</aside>

				<main className="admin-main">
					<div className="admin-page-header">
						<div>
							<h1 className="admin-page-title">
								{TABS.find(t => t.key === activeTab)?.icon}{' '}
								{TABS.find(t => t.key === activeTab)?.label}
							</h1>
							<p className="admin-page-sub">
								{activeTab === 'overview' && 'Platform statistics at a glance'}
								{activeTab === 'users'    && `${filteredUsers.length} of ${stats.total_users} users`}
								{activeTab === 'posts'    && `${filteredPosts.length} of ${stats.total_posts} posts`}
							</p>
						</div>
						{activeTab !== 'overview' && (
							<div className="admin-toolbar">
								<div className="admin-search-wrap">
									<svg width="15" height="15" viewBox="0 0 17 17" fill="none">
										<circle cx="7" cy="7" r="6" stroke="#aaa"/>
										<path stroke="#aaa" strokeLinecap="round" d="M16 16l-3-3"/>
									</svg>
									<input className="admin-search"
										placeholder={`Search ${activeTab}...`}
										value={search}
										onChange={e => setSearch(e.target.value)}
									/>
								</div>
								{activeTab === 'posts' && (
									<select className="admin-filter" value={visFilter} onChange={e => setVisFilter(e.target.value)}>
										<option value="all">All</option>
										<option value="public">🌍 Public</option>
										<option value="private">🔒 Private</option>
									</select>
								)}
								{activeTab === 'users' && (
									<select className="admin-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
										<option value="all">All Roles</option>
										<option value="admin">Admin</option>
										<option value="user">User</option>
									</select>
								)}
							</div>
						)}
					</div>

					{/* Overview */}
					{activeTab === 'overview' && (
						<div className="overview-content">
							<div className="admin-stats-grid">
								{statCards.map(c => (
									<div className="stat-card" key={c.label} style={{'--accent': c.color}}>
										<div className="stat-icon-wrap">{c.icon}</div>
										<div className="stat-info">
											<p className="stat-value">{c.value}</p>
											<p className="stat-label">{c.label}</p>
										</div>
										<div className="stat-bar" />
									</div>
								))}
							</div>
							<div className="overview-bottom">
								<div className="activity-card">
									<h3 className="section-title">Recent Posts</h3>
									<div className="activity-list">
										{stats.recent_posts.slice(0, 8).map(p => (
											<div className="activity-item" key={p.id}>
												<div className="activity-avatar">
													{p.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
												</div>
												<div className="activity-body">
													<p><strong>{p.author}</strong></p>
													<span className="activity-preview">{p.content || '(media only)'}</span>
												</div>
												<div className="activity-right">
													<span className={`role-badge ${p.visibility}`}>
														{p.visibility === 'public' ? '🌍' : '🔒'}
													</span>
													<span className="activity-date">{fmt(p.created_at)}</span>
												</div>
											</div>
										))}
									</div>
								</div>
								<div className="overview-right-col">
									<div className="top-users-card">
										<h3 className="section-title">Post Distribution</h3>
										<Donut public={stats.public_posts} private={stats.private_posts} />
									</div>
									<div className="top-users-card">
										<h3 className="section-title">Recent Users</h3>
										<div className="top-users-list">
											{stats.users.slice(0, 5).map(u => (
												<div className="top-user-item" key={u.id}>
													<div className="activity-avatar">
														{`${u.first_name[0]}${u.last_name[0]}`.toUpperCase()}
													</div>
													<div className="activity-body">
														<p><strong>{u.first_name} {u.last_name}</strong></p>
														<span className="activity-preview">{u.email}</span>
													</div>
													<span className={`role-badge ${u.is_staff ? 'admin' : 'user'}`}>
														{u.is_staff ? 'Admin' : 'User'}
													</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Users Tab */}
					{activeTab === 'users' && (
						<div className="admin-table-wrap">
							<table className="admin-table">
								<thead>
									<tr>
										<th>#</th><th>User</th><th>Email</th><th>Role</th><th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{filteredUsers.length === 0 ? (
										<tr><td colSpan="5" className="table-empty">No users found</td></tr>
									) : filteredUsers.map(u => (
										<tr key={u.id}>
											<td className="td-muted">#{u.id}</td>
											<td>
												<div className="table-user">
													<div className="table-avatar">
														{`${u.first_name[0]}${u.last_name[0]}`.toUpperCase()}
													</div>
													{u.first_name} {u.last_name}
												</div>
											</td>
											<td className="td-muted">{u.email}</td>
											<td>
												<span className={`role-badge ${u.is_staff ? 'admin' : 'user'}`}>
													{u.is_staff ? '⚙️ Admin' : '👤 User'}
												</span>
											</td>
											<td>
												<div className="action-btns">
													<button className="act-btn role-btn"
														disabled={actionLoading === `role-${u.id}` || u.id === user.id}
														onClick={() => handleToggleRole(u.id)}
														title={u.is_staff ? 'Remove Admin' : 'Make Admin'}
													>
														{actionLoading === `role-${u.id}` ? '...' : u.is_staff ? '↓ User' : '↑ Admin'}
													</button>
													<button className="act-btn del-btn"
														disabled={actionLoading === `user-${u.id}` || u.id === user.id}
														onClick={() => handleDeleteUser(u.id)}
														title="Delete user"
													>
														{actionLoading === `user-${u.id}` ? '...' : '🗑'}
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Posts Tab */}
					{activeTab === 'posts' && (
						<div className="admin-table-wrap">
							{selectedPosts.size > 0 && (
								<div className="bulk-action-bar">
									<span className="bulk-count">{selectedPosts.size} post{selectedPosts.size > 1 ? 's' : ''} selected</span>
									<button className="bulk-del-btn"
										disabled={actionLoading === 'bulk'}
										onClick={handleBulkDelete}
									>
										{actionLoading === 'bulk' ? 'Deleting...' : `🗑 Delete ${selectedPosts.size} selected`}
									</button>
									<button className="bulk-clear-btn" onClick={() => setSelectedPosts(new Set())}>✕ Clear</button>
								</div>
							)}
							<table className="admin-table">
								<thead>
									<tr>
										<th>
											<input type="checkbox" className="row-check"
												checked={filteredPosts.length > 0 && selectedPosts.size === filteredPosts.length}
												ref={el => { if (el) el.indeterminate = selectedPosts.size > 0 && selectedPosts.size < filteredPosts.length }}
												onChange={toggleSelectAll}
											/>
										</th>
										<th>#</th><th>Author</th><th>Content</th><th>Visibility</th>
										<th>Likes</th><th>Comments</th><th>Date</th><th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{filteredPosts.length === 0 ? (
										<tr><td colSpan="9" className="table-empty">No posts found</td></tr>
									) : filteredPosts.map(p => (
										<tr key={p.id} className={selectedPosts.has(p.id) ? 'row-selected' : ''}>
											<td>
												<input type="checkbox" className="row-check"
													checked={selectedPosts.has(p.id)}
													onChange={() => toggleSelectPost(p.id)}
												/>
											</td>
											<td className="td-muted">#{p.id}</td>
											<td>
												<div className="table-user">
													<div className="table-avatar">
														{p.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
													</div>
													{p.author}
												</div>
											</td>
											<td className="post-preview td-muted">{p.content || '—'}</td>
											<td>
												<button
													className={`vis-toggle-btn ${p.visibility}`}
													disabled={actionLoading === `vis-${p.id}`}
													onClick={() => handleToggleVisibility(p.id, p.visibility)}
													title="Click to toggle visibility"
												>
													{actionLoading === `vis-${p.id}` ? '...' : p.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
												</button>
											</td>
											<td className="td-muted">❤️ {p.likes}</td>
											<td className="td-muted">💬 {p.comments}</td>
											<td className="td-muted">{fmt(p.created_at)}</td>
											<td>
												<div className="action-btns">
													<button className="act-btn edit-btn"
														onClick={() => setEditPost(p)}
														title="Edit post"
													>
														✏️ Edit
													</button>
													<button className="act-btn del-btn"
														disabled={actionLoading === `post-${p.id}`}
														onClick={() => handleDeletePost(p.id)}
														title="Delete post"
													>
														{actionLoading === `post-${p.id}` ? '...' : '🗑'}
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</main>
			</div>
		</div>
	)
}

export default AdminDashboard
