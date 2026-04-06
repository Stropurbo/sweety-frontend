import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../context/useAuth'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import '../styles/profile.css'

const TABS = ['Posts', 'Photos', 'Videos']

const ImageViewer = ({ src, onClose }) => {
	useEffect(() => {
		const handler = (e) => {
			if (e.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [onClose])
	return (
		<div
			className="prof-viewer-overlay"
			onClick={onClose}
		>
			<button
				className="prof-viewer-close"
				onClick={onClose}
			>
				✕
			</button>
			<img
				src={src}
				alt=""
				onClick={(e) => e.stopPropagation()}
			/>
		</div>
	)
}

const EditProfileModal = ({ user, onClose, onSave }) => {
	const [tab, setTab] = useState('info')
	const [firstName, setFirstName] = useState(user.first_name)
	const [lastName, setLastName] = useState(user.last_name)
	const [bio, setBio] = useState(user.bio || '')
	const [avatarFile, setAvatarFile] = useState(null)
	const [avatarPreview, setAvatarPreview] = useState(user.avatar || null)
	const [coverFile, setCoverFile] = useState(null)
	const [coverPreview, setCoverPreview] = useState(user.cover_photo || null)
	const [emailVisible, setEmailVisible] = useState(user.email_visible ?? true)
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState(null)

	const showToast = (msg, type = 'success') => {
		setToast({ msg, type })
		setTimeout(() => setToast(null), 2500)
	}

	const handleAvatar = (e) => {
		const f = e.target.files[0]
		if (!f) return
		setAvatarFile(f)
		setAvatarPreview(URL.createObjectURL(f))
		e.target.value = ''
	}

	const handleCover = (e) => {
		const f = e.target.files[0]
		if (!f) return
		setCoverFile(f)
		setCoverPreview(URL.createObjectURL(f))
		e.target.value = ''
	}

	const handleSaveInfo = async () => {
		if (!firstName.trim() || !lastName.trim())
			return showToast('Name cannot be empty', 'error')
		setSaving(true)
		try {
			const fd = new FormData()
			fd.append('first_name', firstName.trim())
			fd.append('last_name', lastName.trim())
			fd.append('bio', bio)
			if (avatarFile) fd.append('avatar', avatarFile)
			if (coverFile) fd.append('cover_photo', coverFile)
			const res = await api.patch('/auth/profile/update/', fd)
			onSave(res.data)
			showToast('Profile updated!')
			setAvatarFile(null)
			setCoverFile(null)
		} catch {
			showToast('Failed to update profile', 'error')
		} finally {
			setSaving(false)
		}
	}

	const handleSavePrivacy = async () => {
		setSaving(true)
		try {
			const fd = new FormData()
			fd.append('email_visible', emailVisible)
			const res = await api.patch('/auth/profile/update/', fd)
			onSave(res.data)
			showToast('Privacy settings saved!')
		} catch {
			showToast('Failed to save', 'error')
		} finally {
			setSaving(false)
		}
	}

	const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

	return (
		<div
			className="prof-modal-overlay"
			onClick={onClose}
		>
			<div
				className="prof-modal-box"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="prof-modal-header">
					<strong>Edit Profile</strong>
					<button
						className="prof-modal-close"
						onClick={onClose}
					>
						✕
					</button>
				</div>

				<div className="prof-edit-tabs">
					<button
						className={`prof-edit-tab ${tab === 'info' ? 'active' : ''}`}
						onClick={() => setTab('info')}
					>
						👤 Profile Info
					</button>
					<button
						className={`prof-edit-tab ${tab === 'privacy' ? 'active' : ''}`}
						onClick={() => setTab('privacy')}
					>
						🔒 Privacy
					</button>
				</div>

				{toast && <div className={`prof-edit-toast ${toast.type}`}>{toast.msg}</div>}

				{tab === 'info' && (
					<>
						<div className="prof-modal-body">
							<div className="prof-edit-cover-wrap">
								<div className="prof-edit-cover">
									{coverPreview ? (
										<img
											src={coverPreview}
											alt="cover"
										/>
									) : (
										<div className="prof-edit-cover-placeholder" />
									)}
									<label className="prof-edit-cover-btn">
										📷 Change Cover
										<input
											type="file"
											accept="image/*"
											onChange={handleCover}
											hidden
										/>
									</label>
								</div>
							</div>
							<div className="prof-edit-avatar-wrap">
								<div className="prof-edit-avatar">
									{avatarPreview ? (
										<img
											src={avatarPreview}
											alt="avatar"
										/>
									) : (
										<span>{initials}</span>
									)}
								</div>
								<label className="prof-edit-avatar-btn">
									📷 Change Photo
									<input
										type="file"
										accept="image/*"
										onChange={handleAvatar}
										hidden
									/>
								</label>
							</div>
							<div className="prof-edit-row">
								<div className="prof-edit-field">
									<label>First Name</label>
									<input
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										placeholder="First name"
									/>
								</div>
								<div className="prof-edit-field">
									<label>Last Name</label>
									<input
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										placeholder="Last name"
									/>
								</div>
							</div>
							<div className="prof-edit-field">
								<label>
									Bio <span className="prof-edit-hint">{bio.length}/160</span>
								</label>
								<textarea
									value={bio}
									onChange={(e) => setBio(e.target.value.slice(0, 160))}
									rows={3}
									placeholder="Write something about yourself..."
								/>
							</div>
						</div>
						<div className="prof-modal-footer">
							<button
								className="prof-modal-cancel"
								onClick={onClose}
							>
								Cancel
							</button>
							<button
								className="prof-modal-save"
								onClick={handleSaveInfo}
								disabled={saving}
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</>
				)}

				{tab === 'privacy' && (
					<>
						<div className="prof-modal-body">
							<p className="prof-edit-section-desc">
								Control who can see your information on your profile.
							</p>
							<div className="prof-privacy-row">
								<div className="prof-privacy-info">
									<span className="prof-privacy-label">📧 Email Address</span>
									<span className="prof-privacy-sub">
										{emailVisible
											? 'Visible to everyone'
											: 'Hidden from others'}
									</span>
								</div>
								<button
									className={`prof-toggle ${emailVisible ? 'on' : 'off'}`}
									onClick={() => setEmailVisible((v) => !v)}
								>
									<span className="prof-toggle-knob" />
								</button>
							</div>
						</div>
						<div className="prof-modal-footer">
							<button
								className="prof-modal-cancel"
								onClick={onClose}
							>
								Cancel
							</button>
							<button
								className="prof-modal-save"
								onClick={handleSavePrivacy}
								disabled={saving}
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

const Profile = () => {
	const { id } = useParams()
	const { user: currentUser, setUser } = useAuth()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const [profile, setProfile] = useState(null)
	const [posts, setPosts] = useState([])
	const [friends, setFriends] = useState([])
	const [friendStatus, setFriendStatus] = useState(null)
	const [friendLoading, setFriendLoading] = useState(false)
	const [friendMenuOpen, setFriendMenuOpen] = useState(false)
	const friendMenuRef = useRef(null)
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('Posts')
	const [showEditModal, setShowEditModal] = useState(false)
	const [viewerSrc, setViewerSrc] = useState(null)
	const [highlightId, setHighlightId] = useState(null)
	const postRefs = useRef({})

	const [coverMode, setCoverMode] = useState(null)
	const [pendingCoverFile, setPendingCoverFile] = useState(null)
	const [pendingCoverUrl, setPendingCoverUrl] = useState(null)
	const [posY, setPosY] = useState(50)
	const [dragging, setDragging] = useState(false)
	const [dragStartY, setDragStartY] = useState(0)
	const [dragStartPosY, setDragStartPosY] = useState(50)
	const [coverSaving, setCoverSaving] = useState(false)
	const coverAreaRef = useRef(null)

	const isOwner = currentUser?.id === parseInt(id)

	useEffect(() => {
		const handler = (e) => {
			if (friendMenuRef.current && !friendMenuRef.current.contains(e.target))
				setFriendMenuOpen(false)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	useEffect(() => {
		setLoading(true)
		api.get(`/auth/profile/${id}/`)
			.then((res) => {
				setProfile(res.data.user)
				setPosts(res.data.posts)
				setLoading(false)
			})
			.catch(() => navigate('/feed'))
		api.get(`/friends/list/${id}/`)
			.then((r) => setFriends(r.data))
			.catch(() => { /* ignore */ })
		if (currentUser && currentUser.id !== parseInt(id)) {
			api.get(`/friends/status/${id}/`)
				.then((r) => setFriendStatus(r.data.status))
				.catch(() => { /* ignore */ })
		}
	}, [id, navigate, currentUser])

	useEffect(() => {
		if (profile) setPosY(profile.cover_position_y ?? 50)
	}, [profile])

	useEffect(() => {
		const postId = searchParams.get('post')
		if (!postId || loading || posts.length === 0) return
		const id = parseInt(postId)
		setHighlightId(id)
		setTimeout(() => {
			postRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
		}, 100)
		setTimeout(() => setHighlightId(null), 3000)
	}, [searchParams, loading, posts])

	const handleCoverFileSelect = (e) => {
		const f = e.target.files[0]
		if (!f) return
		setPendingCoverFile(f)
		setPendingCoverUrl(URL.createObjectURL(f))
		setPosY(50)
		setCoverMode('reposition')
		e.target.value = ''
	}

	const handleRepositionExisting = () => {
		if (!profile.cover_photo) return
		setPendingCoverFile(null)
		setPendingCoverUrl(null)
		setPosY(profile.cover_position_y ?? 50)
		setCoverMode('reposition')
	}

	const handleDragStart = (e) => {
		setDragging(true)
		const clientY = e.touches ? e.touches[0].clientY : e.clientY
		setDragStartY(clientY)
		setDragStartPosY(posY)
		e.preventDefault()
	}

	const handleDragMove = (e) => {
		if (!dragging) return
		const clientY = e.touches ? e.touches[0].clientY : e.clientY
		const rect = coverAreaRef.current?.getBoundingClientRect()
		if (!rect) return
		const delta = clientY - dragStartY
		const pctDelta = (delta / rect.height) * 100
		const newY = Math.min(100, Math.max(0, dragStartPosY - pctDelta))
		setPosY(newY)
	}

	const handleDragEnd = () => setDragging(false)

	const handleCoverSave = async () => {
		setCoverSaving(true)
		try {
			const fd = new FormData()
			if (pendingCoverFile) fd.append('cover_photo', pendingCoverFile)
			fd.append('cover_position_y', posY)
			const res = await api.patch('/auth/profile/update/', fd)
			setProfile((prev) => ({
				...prev,
				cover_photo: res.data.cover_photo,
				cover_position_y: res.data.cover_position_y,
			}))
			if (isOwner)
				setUser((prev) => ({
					...prev,
					cover_photo: res.data.cover_photo,
					cover_position_y: res.data.cover_position_y,
				}))
			setCoverMode(null)
			setPendingCoverFile(null)
			setPendingCoverUrl(null)
		} finally {
			setCoverSaving(false)
		}
	}

	const handleCoverCancel = () => {
		setCoverMode(null)
		setPendingCoverFile(null)
		setPendingCoverUrl(null)
		setPosY(profile.cover_position_y ?? 50)
	}

	const handleUnfriend = async () => {
		setFriendMenuOpen(false)
		setFriendLoading(true)
		try {
			await api.delete(`/friends/unfriend/${id}/`)
			setFriendStatus('none')
			setFriends(prev => prev.filter(f => f.id !== parseInt(id)))
		} catch { /* ignore */ }
		setFriendLoading(false)
	}

	const handleFriendAction = async () => {
		if (friendLoading) return
		setFriendLoading(true)
		try {
			if (friendStatus === 'none') {
				const r = await api.post(`/friends/request/${id}/`)
				setFriendStatus(r.data.status === 'accepted' ? 'friends' : 'pending_sent')
			} else if (friendStatus === 'pending_received') {
				await api.post(`/friends/respond/${id}/`, { action: 'accept' })
				setFriendStatus('friends')
				api.get(`/friends/list/${id}/`)
					.then((r) => setFriends(r.data))
					.catch(() => {})
			}
		} finally {
			setFriendLoading(false)
		}
	}

	const handleEditSave = (updated) => {
		setProfile((prev) => ({ ...prev, ...updated }))
		if (isOwner) setUser((prev) => ({ ...prev, ...updated }))
	}

	const handlePostDelete = (pid) => setPosts((prev) => prev.filter((p) => p.id !== pid))

	if (loading) return null

	const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
	const photos = posts.flatMap((p) => (p.media || []).filter((m) => m.media_type === 'image'))
	const videos = posts.flatMap((p) => (p.media || []).filter((m) => m.media_type === 'video'))
	const joinedDate = new Date(profile.created_at).toLocaleDateString('en-GB', {
		month: 'long',
		year: 'numeric',
	})

	return (
		<div className="prof-wrap">
			<Navbar />

			<div className="prof-cover-section">
				<div
					className={`prof-cover-img ${coverMode === 'reposition' ? 'reposition-mode' : ''}`}
					ref={coverAreaRef}
					onMouseMove={handleDragMove}
					onMouseUp={handleDragEnd}
					onMouseLeave={handleDragEnd}
					onTouchMove={handleDragMove}
					onTouchEnd={handleDragEnd}
				>
					{pendingCoverUrl || profile.cover_photo ? (
						<img
							src={pendingCoverUrl || profile.cover_photo}
							alt="cover"
							style={{ objectPosition: `center ${posY}%` }}
							className={coverMode === 'reposition' ? 'dragging-cover' : ''}
						/>
					) : (
						<div className="prof-cover-placeholder" />
					)}

					{coverMode === 'reposition' && (
						<>
							<div className="prof-cover-drag-hint">↕ Drag to reposition</div>
							<div
								className="prof-cover-drag-zone"
								onMouseDown={handleDragStart}
								onTouchStart={handleDragStart}
							/>
							<div className="prof-cover-reposition-actions">
								<label className="prof-cover-action-btn">
									📷 Change Photo
									<input
										type="file"
										accept="image/*"
										onChange={handleCoverFileSelect}
										hidden
									/>
								</label>
								<button
									className="prof-cover-action-btn cancel"
									onClick={handleCoverCancel}
								>
									Cancel
								</button>
								<button
									className="prof-cover-action-btn save"
									onClick={handleCoverSave}
									disabled={coverSaving}
								>
									{coverSaving ? 'Saving...' : 'Save Photo'}
								</button>
							</div>
						</>
					)}

					{coverMode === null && (
						<>
							{profile.cover_photo && (
								<div
									className="prof-img-click-zone"
									onClick={() => setViewerSrc(profile.cover_photo)}
								/>
							)}
							{isOwner && (
								<div className="prof-cover-edit-btns">
									{profile.cover_photo && (
										<button
											className="prof-cover-edit-btn"
											onClick={handleRepositionExisting}
										>
											✥ Reposition
										</button>
									)}
									<label className="prof-cover-edit-btn">
										📷{' '}
										{profile.cover_photo
											? 'Change Cover'
											: 'Add Cover Photo'}
										<input
											type="file"
											accept="image/*"
											onChange={handleCoverFileSelect}
											hidden
										/>
									</label>
								</div>
							)}
						</>
					)}
				</div>

				<div className="prof-identity">
					<div className="prof-avatar-wrap">
						<div className="prof-avatar">
							{profile.avatar ? (
								<img
									src={profile.avatar}
									alt="avatar"
								/>
							) : (
								<span>{initials}</span>
							)}
							{profile.avatar && (
								<div
									className="prof-img-click-zone"
									onClick={() => setViewerSrc(profile.avatar)}
								/>
							)}
						</div>
						{isOwner && (
							<label className="prof-avatar-edit">
								📷
								<input
									type="file"
									accept="image/*"
									onChange={async (e) => {
										const f = e.target.files[0]
										if (!f) return
										const fd = new FormData()
										fd.append('avatar', f)
										const res = await api.patch('/auth/profile/update/', fd)
										setProfile((prev) => ({
											...prev,
											avatar: res.data.avatar,
										}))
										if (isOwner)
											setUser((prev) => ({
												...prev,
												avatar: res.data.avatar,
											}))
										e.target.value = ''
									}}
									hidden
								/>
							</label>
						)}
					</div>

					<div className="prof-name-area">
						<h1 className="prof-name">
							{profile.first_name} {profile.last_name}
						</h1>
						<p className="prof-post-count">{profile.post_count} posts</p>
						{profile.bio && <p className="prof-bio">{profile.bio}</p>}
					</div>

					<div className="prof-header-actions">
						{isOwner ? (
							<button
								className="prof-btn prof-btn-edit"
								onClick={() => setShowEditModal(true)}
							>
								✏️ Edit Profile
							</button>
						) : (
							<>
								{friendStatus === 'none' && (
									<button
										className="prof-btn prof-btn-msg"
										onClick={handleFriendAction}
										disabled={friendLoading}
									>
										👤 Add Friend
									</button>
								)}
								{friendStatus === 'pending_sent' && (
									<button
										className="prof-btn prof-btn-pending"
										disabled
									>
										⏳ Pending
									</button>
								)}
								{friendStatus === 'pending_received' && (
									<button
										className="prof-btn prof-btn-msg"
										onClick={handleFriendAction}
										disabled={friendLoading}
									>
										✓ Accept Request
									</button>
								)}
								{friendStatus === 'friends' && (
									<div className="prof-friend-menu" ref={friendMenuRef}>
										<button
											className="prof-btn prof-btn-friends"
											onClick={() => setFriendMenuOpen(o => !o)}
										>
											✓ Friends
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft:4}}><polyline points="6 9 12 15 18 9"/></svg>
										</button>
										{friendMenuOpen && (
											<div className="prof-friend-dropdown">
												<button onClick={() => { navigate(`/friends/${currentUser?.id}`); setFriendMenuOpen(false) }}>
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
													View Friends
												</button>
												<div style={{height:1, background:'#f0f0f0', margin:'3px 0'}} />
												<button className="prof-friend-dropdown-danger" onClick={handleUnfriend} disabled={friendLoading}>
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
													{friendLoading ? 'Removing...' : 'Unfriend'}
												</button>
											</div>
										)}
									</div>
								)}
								<button
									className="prof-btn prof-btn-edit"
									onClick={() => navigate('/feed')}
								>
									💬 Message
								</button>
							</>
						)}
					</div>
				</div>

				<div className="prof-tabs">
					{TABS.map((t) => (
						<button
							key={t}
							className={`prof-tab ${activeTab === t ? 'active' : ''}`}
							onClick={() => setActiveTab(t)}
						>
							{t}
							{t === 'Photos' && photos.length > 0 && (
								<span className="prof-tab-count">{photos.length}</span>
							)}
							{t === 'Videos' && videos.length > 0 && (
								<span className="prof-tab-count">{videos.length}</span>
							)}
						</button>
					))}
				</div>
			</div>

			<div className="prof-body">
				<aside className="prof-sidebar">
					<div className="prof-info-card">
						<h3 className="prof-info-title">About</h3>
						{profile.bio ? (
							<p className="prof-info-bio">{profile.bio}</p>
						) : (
							isOwner && <p className="prof-info-empty">Add a bio</p>
						)}
						<div className="prof-info-row">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<rect
									x="3"
									y="4"
									width="18"
									height="18"
									rx="2"
								/>
								<line
									x1="16"
									y1="2"
									x2="16"
									y2="6"
								/>
								<line
									x1="8"
									y1="2"
									x2="8"
									y2="6"
								/>
								<line
									x1="3"
									y1="10"
									x2="21"
									y2="10"
								/>
							</svg>
							<span>Joined {joinedDate}</span>
						</div>
						{(profile.email_visible || isOwner) && (
							<div className="prof-info-row">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
									<circle
										cx="12"
										cy="7"
										r="4"
									/>
								</svg>
								<span>{profile.email}</span>
								{isOwner && !profile.email_visible && (
									<span className="prof-email-hidden-badge">Hidden</span>
								)}
							</div>
						)}
						{profile.is_staff && (
							<div className="prof-info-row">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
								</svg>
								<span className="prof-admin-badge">Admin</span>
							</div>
						)}
					</div>

					{photos.length > 0 && (
						<div className="prof-info-card">
							<div className="prof-photos-header">
								<h3 className="prof-info-title">Photos</h3>
								{photos.length > 9 && (
									<button
										className="prof-see-all"
										onClick={() => setActiveTab('Photos')}
									>
										See all
									</button>
								)}
							</div>
							<div className="prof-photos-grid">
								{photos.slice(0, 9).map((m) => (
									<div
										key={m.id}
										className="prof-photo-thumb"
									>
										<img
											src={m.url}
											alt=""
										/>
									</div>
								))}
							</div>
						</div>
					)}

					{friends.length > 0 && (
						<div className="prof-info-card">
							<div className="prof-photos-header">
								<h3
									className="prof-info-title"
									style={{ margin: 0, border: 'none', padding: 0 }}
								>
									Friends{' '}
									<span className="prof-friends-count">{friends.length}</span>
								</h3>
								<button
									className="prof-see-all"
									onClick={() => navigate(`/friends/${id}`)}
								>
									See all
								</button>
							</div>
							<div className="prof-friends-grid">
								{friends.slice(0, 9).map((f) => {
									const fi =
										`${f.first_name[0]}${f.last_name[0]}`.toUpperCase()
									return (
										<div
											key={f.id}
											className="prof-friend-item"
											onClick={() => navigate(`/profile/${f.id}`)}
										>
											<div className="prof-friend-avatar">
												{f.avatar ? (
													<img
														src={f.avatar}
														alt=""
													/>
												) : (
													<span>{fi}</span>
												)}
											</div>
											<span className="prof-friend-name">
												{f.first_name}
											</span>
										</div>
									)
								})}
							</div>
						</div>
					)}
				</aside>

				<main className="prof-main">
					{activeTab === 'Posts' && (
						<div className="prof-posts">
							{posts.length === 0 ? (
								<div className="prof-empty">
									<span>📝</span>
									<p>No posts yet</p>
								</div>
							) : (
								posts.map((p) => (
									<div
										key={p.id}
										ref={(el) => (postRefs.current[p.id] = el)}
									>
										<PostCard
											post={p}
											currentUser={currentUser}
											onDelete={handlePostDelete}
											highlighted={highlightId === p.id}
										/>
									</div>
								))
							)}
						</div>
					)}

					{activeTab === 'Photos' && (
						<div className="prof-media-tab-grid">
							{photos.length === 0 ? (
								<div className="prof-empty">
									<span>🖼️</span>
									<p>No photos yet</p>
								</div>
							) : (
								photos.map((m) => (
									<div
										key={m.id}
										className="prof-media-tab-item"
									>
										<img
											src={m.url}
											alt=""
										/>
									</div>
								))
							)}
						</div>
					)}

					{activeTab === 'Videos' && (
						<div className="prof-media-tab-grid">
							{videos.length === 0 ? (
								<div className="prof-empty">
									<span>🎬</span>
									<p>No videos yet</p>
								</div>
							) : (
								videos.map((m) => (
									<div
										key={m.id}
										className="prof-media-tab-item"
									>
										<video
											src={m.url}
											controls
										/>
									</div>
								))
							)}
						</div>
					)}
				</main>
			</div>

			{viewerSrc && (
				<ImageViewer
					src={viewerSrc}
					onClose={() => setViewerSrc(null)}
				/>
			)}

			{showEditModal && (
				<EditProfileModal
					user={profile}
					onClose={() => setShowEditModal(false)}
					onSave={handleEditSave}
				/>
			)}
		</div>
	)
}

export default Profile
