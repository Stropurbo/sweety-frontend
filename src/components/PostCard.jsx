import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import CommentSection from './CommentSection'

// ── Friend Hover Card ──
const FriendHoverCard = ({ author, currentUser }) => {
	const [fStatus, setFStatus] = useState(null) // null|'none'|'friends'|'pending_sent'|'pending_received'
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		if (!currentUser || currentUser.id === author.id) return
		api.get(`/friends/status/${author.id}/`)
			.then((r) => setFStatus(r.data.status))
			.catch(() => { /* ignore */ })
	}, [author.id, currentUser])

	const handleAction = async () => {
		if (loading) return
		setLoading(true)
		try {
			if (fStatus === 'none') {
				const r = await api.post(`/friends/request/${author.id}/`)
				setFStatus(r.data.status === 'accepted' ? 'friends' : 'pending_sent')
			} else if (fStatus === 'pending_received') {
				await api.post(`/friends/respond/${author.id}/`, { action: 'accept' })
				setFStatus('friends')
			}
		} finally {
			setLoading(false)
		}
	}

	const initials = `${author.first_name[0]}${author.last_name[0]}`.toUpperCase()

	return (
		<div
			className="friend-hover-card"
			onClick={(e) => e.stopPropagation()}
		>
			<div
				className="fhc-avatar"
				onClick={() => navigate(`/profile/${author.id}`)}
				style={{ cursor: 'pointer' }}
			>
				{author.avatar ? (
					<img
						src={author.avatar}
						alt=""
					/>
				) : (
					<span>{initials}</span>
				)}
			</div>
			<div
				className="fhc-name"
				onClick={() => navigate(`/profile/${author.id}`)}
			>
				{author.first_name} {author.last_name}
			</div>
			{author.bio && <div className="fhc-bio">{author.bio.slice(0, 60)}</div>}
			{currentUser && currentUser.id !== author.id && (
				<div className="fhc-actions">
					{fStatus === null && <div className="fhc-btn fhc-loading">...</div>}
					{fStatus === 'none' && (
						<button
							className="fhc-btn fhc-add"
							onClick={handleAction}
							disabled={loading}
						>
							+ Add Friend
						</button>
					)}
					{fStatus === 'pending_sent' && (
						<button
							className="fhc-btn fhc-pending"
							disabled
						>
							⏳ Pending
						</button>
					)}
					{fStatus === 'pending_received' && (
						<button
							className="fhc-btn fhc-accept"
							onClick={handleAction}
							disabled={loading}
						>
							✓ Accept Request
						</button>
					)}
					{fStatus === 'friends' && (
						<button
							className="fhc-btn fhc-friends"
							disabled
						>
							✓ Friends
						</button>
					)}
					<button
						className="fhc-btn fhc-profile"
						onClick={() => navigate(`/profile/${author.id}`)}
					>
						View Profile
					</button>
				</div>
			)}
		</div>
	)
}

// ── Media Lightbox Viewer ──
const MediaViewer = ({ media, startIndex, onClose }) => {
	const [idx, setIdx] = useState(startIndex)
	const current = media[idx]

	useEffect(() => {
		const handler = (e) => {
			if (e.key === 'Escape') onClose()
			if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, media.length - 1))
			if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0))
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [media.length, onClose])

	return (
		<div
			className="mv-overlay"
			onClick={onClose}
		>
			{/* close */}
			<button
				className="mv-close"
				onClick={onClose}
			>
				✕
			</button>

			{/* counter */}
			{media.length > 1 && (
				<div className="mv-counter">
					{idx + 1} / {media.length}
				</div>
			)}

			{/* prev */}
			{idx > 0 && (
				<button
					className="mv-arrow mv-prev"
					onClick={(e) => {
						e.stopPropagation()
						setIdx((i) => i - 1)
					}}
				>
					&#8249;
				</button>
			)}

			{/* media */}
			<div
				className="mv-content"
				onClick={(e) => e.stopPropagation()}
			>
				{current.media_type === 'video' ? (
					<video
						src={current.url}
						controls
						autoPlay
						className="mv-media"
					/>
				) : (
					<img
						src={current.url}
						alt=""
						className="mv-media"
					/>
				)}
			</div>

			{/* next */}
			{idx < media.length - 1 && (
				<button
					className="mv-arrow mv-next"
					onClick={(e) => {
						e.stopPropagation()
						setIdx((i) => i + 1)
					}}
				>
					&#8250;
				</button>
			)}

			{/* dot indicators */}
			{media.length > 1 && (
				<div
					className="mv-dots"
					onClick={(e) => e.stopPropagation()}
				>
					{media.map((_, i) => (
						<button
							key={i}
							className={`mv-dot ${i === idx ? 'active' : ''}`}
							onClick={() => setIdx(i)}
						/>
					))}
				</div>
			)}
		</div>
	)
}

const EditModal = ({ post, onClose, onSave }) => {
	const [content, setContent] = useState(post.content)
	const [visibility, setVisibility] = useState(post.visibility)
	const [existingMedia, setExistingMedia] = useState(post.media || [])
	const [newFiles, setNewFiles] = useState([]) // [{file, preview, type}]
	const [selectedMedia, setSelectedMedia] = useState(new Set())
	const [saving, setSaving] = useState(false)

	const allMedia = [
		...existingMedia.map((m) => ({ ...m, isNew: false, key: `e-${m.id}` })),
		...newFiles.map((m, i) => ({
			id: `new-${i}`,
			url: m.preview,
			media_type: m.type,
			isNew: true,
			idx: i,
			key: `n-${i}`,
		})),
	]

	const toggleSelect = (key) =>
		setSelectedMedia((prev) => {
			const s = new Set(prev)
			s.has(key) ? s.delete(key) : s.add(key)
			return s
		})

	const toggleSelectAll = () => {
		setSelectedMedia(
			selectedMedia.size === allMedia.length
				? new Set()
				: new Set(allMedia.map((m) => m.key)),
		)
	}

	const removeSelected = () => {
		const exIds = [...selectedMedia]
			.filter((k) => k.startsWith('e-'))
			.map((k) => parseInt(k.slice(2)))
		const nxIdx = [...selectedMedia]
			.filter((k) => k.startsWith('n-'))
			.map((k) => parseInt(k.slice(2)))
		setExistingMedia((prev) => prev.filter((m) => !exIds.includes(m.id)))
		setNewFiles((prev) => prev.filter((_, i) => !nxIdx.includes(i)))
		setSelectedMedia(new Set())
	}

	const removeSingle = (m) => {
		if (m.isNew) setNewFiles((prev) => prev.filter((_, i) => i !== m.idx))
		else setExistingMedia((prev) => prev.filter((x) => x.id !== m.id))
		setSelectedMedia((prev) => {
			const s = new Set(prev)
			s.delete(m.key)
			return s
		})
	}

	const handleAddFiles = (e, type) => {
		const items = Array.from(e.target.files).map((f) => ({
			file: f,
			preview: URL.createObjectURL(f),
			type,
		}))
		setNewFiles((prev) => [...prev, ...items])
		e.target.value = ''
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			const fd = new FormData()
			fd.append('content', content)
			fd.append('visibility', visibility)
			const originalIds = (post.media || []).map((m) => m.id)
			const keptIds = existingMedia.map((m) => m.id)
			originalIds
				.filter((id) => !keptIds.includes(id))
				.forEach((id) => fd.append('remove_media_ids', id))
			newFiles.forEach((m) => fd.append(m.type === 'image' ? 'images' : 'videos', m.file))
			const res = await api.patch(`/posts/${post.id}/`, fd)
			onSave(res.data)
			onClose()
		} catch {
			setSaving(false)
		}
	}

	const allSelected = allMedia.length > 0 && selectedMedia.size === allMedia.length
	const someSelected = selectedMedia.size > 0 && selectedMedia.size < allMedia.length

	return (
		<div
			className="pc-modal-overlay"
			onClick={onClose}
		>
			<div
				className="pc-modal-box"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="pc-modal-header">
					<strong>Edit Post</strong>
					<button
						className="pc-modal-close"
						onClick={onClose}
					>
						✕
					</button>
				</div>

				<div className="pc-modal-body">
					<textarea
						className="pc-modal-textarea"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						rows={4}
						placeholder="What's on your mind?"
					/>
					<select
						className="pc-modal-select"
						value={visibility}
						onChange={(e) => setVisibility(e.target.value)}
					>
						<option value="public">🌍 Public — Everyone can see</option>
						<option value="private">🔒 Private — Only you can see</option>
					</select>

					{/* ── Media Section ── */}
					<div className="pc-media-section">
						<div className="pc-media-header">
							<div className="pc-media-title-row">
								{allMedia.length > 0 && (
									<input
										type="checkbox"
										className="pc-check"
										checked={allSelected}
										ref={(el) => {
											if (el) el.indeterminate = someSelected
										}}
										onChange={toggleSelectAll}
									/>
								)}
								<span className="pc-media-label">
									Media ({allMedia.length})
								</span>
							</div>
							<div className="pc-media-actions">
								{selectedMedia.size > 0 ? (
									<button
										className="pc-media-btn pc-media-remove"
										onClick={removeSelected}
									>
										🗑 Remove {selectedMedia.size}
									</button>
								) : (
									<>
										<label className="pc-media-btn pc-media-add">
											+ Photo
											<input
												type="file"
												accept="image/*"
												multiple
												onChange={(e) => handleAddFiles(e, 'image')}
												hidden
											/>
										</label>
										<label className="pc-media-btn pc-media-add">
											+ Video
											<input
												type="file"
												accept="video/*"
												multiple
												onChange={(e) => handleAddFiles(e, 'video')}
												hidden
											/>
										</label>
									</>
								)}
							</div>
						</div>

						{allMedia.length === 0 ? (
							<div className="pc-no-media">No media attached</div>
						) : (
							<div className="pc-media-grid">
								{allMedia.map((m) => (
									<div
										key={m.key}
										className={`pc-media-thumb ${m.isNew ? 'is-new' : ''} ${selectedMedia.has(m.key) ? 'is-selected' : ''}`}
										onClick={() => toggleSelect(m.key)}
									>
										{m.media_type === 'video' ? (
											<video src={m.url} />
										) : (
											<img
												src={m.url}
												alt=""
											/>
										)}
										<input
											type="checkbox"
											className="pc-thumb-check"
											checked={selectedMedia.has(m.key)}
											onChange={() => toggleSelect(m.key)}
											onClick={(e) => e.stopPropagation()}
										/>
										{m.isNew && <span className="pc-new-badge">New</span>}
										{!selectedMedia.has(m.key) && (
											<button
												className="pc-thumb-remove"
												onClick={(e) => {
													e.stopPropagation()
													removeSingle(m)
												}}
											>
												✕
											</button>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="pc-modal-footer">
					<button
						className="pc-modal-cancel"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						className="pc-modal-save"
						onClick={handleSave}
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</div>
		</div>
	)
}

const REACTIONS = [
	{ type: 'like',  emoji: '👍', label: 'Like',  color: '#1890ff' },
	{ type: 'love',  emoji: '❤️', label: 'Love',  color: '#f5222d' },
	{ type: 'haha',  emoji: '😂', label: 'Haha',  color: '#faad14' },
	{ type: 'wow',   emoji: '😮', label: 'Wow',   color: '#faad14' },
	{ type: 'sad',   emoji: '😢', label: 'Sad',   color: '#faad14' },
	{ type: 'angry', emoji: '😡', label: 'Angry', color: '#ff4d4f' },
]

const PostCard = ({ post, onDelete, currentUser }) => {
	const [likes, setLikes] = useState(post.likes_count)
	const [myReaction, setMyReaction] = useState(post.my_reaction || null)
	const [reactionSummary, setReactionSummary] = useState(post.reaction_summary || {})
	const [showReactionPicker, setShowReactionPicker] = useState(false)
	const reactionHoverRef = useRef(null)
	const reactionBtnRef = useRef(null)
	const [isInterested, setIsInterested] = useState(post.is_interested || false)
	const [interestCount, setInterestCount] = useState(post.interest_count || 0)
	const [likedBy] = useState(post.liked_by)
	const [showComments, setShowComments] = useState(false)
	const [showLikedBy, setShowLikedBy] = useState(false)
	const [commentCount, setCommentCount] = useState(post.comments.length)
	const [menuOpen, setMenuOpen] = useState(false)
	const [copied, setCopied] = useState(false)
	const [hidden, setHidden] = useState(() => post.is_hidden || false)
	const [saved, setSaved] = useState(() => post.is_saved || false)
	const [reported, setReported] = useState(false)
	const [postMedia, setPostMedia] = useState(post.media || [])
	const [postContent, setPostContent] = useState(post.content)
	const [postVisibility, setPostVisibility] = useState(post.visibility)
	const [showEditModal, setShowEditModal] = useState(false)
	const [toast, setToast] = useState(null)
	const [viewerIndex, setViewerIndex] = useState(null)
	const menuRef = useRef(null)

	const [timeAgoString] = useState(() => {
		const s = Math.floor((Date.now() - new Date(post.created_at)) / 1000)
		if (s < 60) return `${s}s ago`
		if (s < 3600) return `${Math.floor(s / 60)}m ago`
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`
		return `${Math.floor(s / 86400)}d ago`
	})

	useEffect(() => {
		const handler = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const showToast = (msg, type = 'info') => {
		setToast({ msg, type })
		setTimeout(() => setToast(null), 2500)
	}

	const handleReact = async (type) => {
		setShowReactionPicker(false)
		try {
			const res = await api.post(`/posts/${post.id}/react/`, { reaction_type: type })
			setLikes(res.data.likes_count)
			setMyReaction(res.data.reacted ? res.data.reaction_type : null)
			setReactionSummary(prev => {
				const n = { ...prev }
				if (res.data.old_type) {
					if (n[res.data.old_type] > 1) n[res.data.old_type]--
					else delete n[res.data.old_type]
				}
				if (res.data.reacted) {
					n[res.data.reaction_type] = (n[res.data.reaction_type] || 0) + (res.data.old_type ? 0 : 1)
				} else {
					if (n[type] > 1) n[type]--
					else delete n[type]
				}
				return n
			})
		} catch { /* ignore */ }
	}

	const handleShare = () => {
		navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const handleDelete = async () => {
		if (!window.confirm('Delete this post?')) return
		setMenuOpen(false)
		try {
			await api.delete(`/posts/${post.id}/`)
			onDelete(post.id)
		} catch { /* ignore */ }
	}

	const handleToggleVisibility = async () => {
		const newVis = postVisibility === 'public' ? 'private' : 'public'
		setMenuOpen(false)
		try {
			await api.patch(`/posts/${post.id}/`, { visibility: newVis })
			setPostVisibility(newVis)
			showToast(`Post set to ${newVis}`, 'success')
		} catch {
			showToast('Failed to update visibility', 'error')
		}
	}

	const handleSave = async () => {
		try {
			if (saved) {
				await api.delete(`/posts/${post.id}/save/`)
				setSaved(false)
				showToast('Post removed from saved', 'info')
			} else {
				await api.post(`/posts/${post.id}/save/`)
				setSaved(true)
				showToast('Post saved!', 'success')
			}
		} catch {
			showToast('Failed', 'error')
		}
		setMenuOpen(false)
	}

	const handleHide = async () => {
		try {
			await api.post(`/posts/${post.id}/hide/`)
			setHidden(true)
			setMenuOpen(false)
			showToast('Post hidden', 'info')
		} catch {
			showToast('Failed', 'error')
		}
	}

	const handleUnhide = async () => {
		try {
			await api.delete(`/posts/${post.id}/hide/`)
			setHidden(false)
		} catch {
			showToast('Failed', 'error')
		}
	}

	const handleReport = () => {
		setReported(true)
		setMenuOpen(false)
		showToast('Post reported. Thank you for your feedback.', 'warning')
	}

	const handleEditSave = (updated) => {
		setPostContent(updated.content)
		setPostVisibility(updated.visibility)
		if (updated.media) setPostMedia(updated.media)
		showToast('Post updated!', 'success')
	}

	const isOwner = currentUser?.id === post.author.id
	const initials = `${post.author.first_name[0]}${post.author.last_name[0]}`.toUpperCase()
	const navigate = useNavigate()
	const [showHoverCard, setShowHoverCard] = useState(false)
	const hoverTimeout = useRef(null)

	const handleAuthorMouseEnter = () => {
		hoverTimeout.current = setTimeout(() => setShowHoverCard(true), 300)
	}
	const handleAuthorMouseLeave = () => {
		clearTimeout(hoverTimeout.current)
		setTimeout(() => setShowHoverCard(false), 200)
	}

	if (hidden)
		return (
			<div className="post-card post-hidden-banner">
				<span>Post hidden</span>
				<button
					className="pd-item"
					onClick={handleUnhide}
				>
					Undo
				</button>
			</div>
		)

	return (
		<>
			{showEditModal && (
				<EditModal
					post={{
						...post,
						content: postContent,
						visibility: postVisibility,
						media: postMedia,
					}}
					onClose={() => setShowEditModal(false)}
					onSave={handleEditSave}
				/>
			)}
			{viewerIndex !== null && postMedia.length > 0 && (
				<MediaViewer
					media={postMedia}
					startIndex={viewerIndex}
					onClose={() => setViewerIndex(null)}
				/>
			)}

			<div className="post-card">
				{toast && <div className={`pc-toast pc-toast-${toast.type}`}>{toast.msg}</div>}

				<div className="post-header">
					<div
						className="post-avatar prof-link"
						onClick={() => navigate(`/profile/${post.author.id}`)}
					>
						{post.author.avatar ? (
							<img
								src={post.author.avatar}
								alt=""
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover',
									borderRadius: '50%',
								}}
							/>
						) : (
							initials
						)}
					</div>
					<div className="post-meta">
						<div
							className="post-author-wrap"
							onMouseEnter={handleAuthorMouseEnter}
							onMouseLeave={handleAuthorMouseLeave}
						>
							<strong
								className="prof-link"
								onClick={() => navigate(`/profile/${post.author.id}`)}
							>
								{post.author.first_name} {post.author.last_name}
							</strong>
							{showHoverCard && !isOwner && (
								<FriendHoverCard
									author={post.author}
									currentUser={currentUser}
								/>
							)}
						</div>
						<div className="post-meta-sub">
							<span className="post-time">{timeAgoString}</span>
							<span className="post-dot">·</span>
							<span className={`vis-tag ${postVisibility}`}>
								{postVisibility === 'public' ? '🌍 Public' : '🔒 Private'}
							</span>
						</div>
					</div>

					<div
						className="post-menu"
						ref={menuRef}
					>
						<button
							className="post-menu-trigger"
							onClick={() => setMenuOpen((o) => !o)}
						>
							<svg
								width="4"
								height="17"
								viewBox="0 0 4 17"
								fill="none"
							>
								<circle
									cx="2"
									cy="2"
									r="2"
									fill="#C4C4C4"
								/>
								<circle
									cx="2"
									cy="8"
									r="2"
									fill="#C4C4C4"
								/>
								<circle
									cx="2"
									cy="15"
									r="2"
									fill="#C4C4C4"
								/>
							</svg>
						</button>

						{menuOpen && (
							<div className="post-dropdown">
								{/* ── Owner only ── */}
								{isOwner && (
									<>
										<button
											className="pd-item"
											onClick={() => {
												setShowEditModal(true)
												setMenuOpen(false)
											}}
										>
											<svg
												width="15"
												height="15"
												viewBox="0 0 20 20"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.6"
											>
												<path d="M14.7 2.3a1 1 0 011.4 1.4l-1.4 1.4-1.4-1.4 1.4-1.4zM2 14l1-4L12.3 4.7l3 3L6 17l-4 1z" />
											</svg>
											Edit Post
										</button>
										<button
											className="pd-item"
											onClick={handleToggleVisibility}
										>
											{postVisibility === 'public' ? (
												<>
													<svg
														width="15"
														height="15"
														viewBox="0 0 20 20"
														fill="none"
														stroke="currentColor"
														strokeWidth="1.6"
													>
														<rect
															x="3"
															y="9"
															width="14"
															height="10"
															rx="2"
														/>
														<path d="M7 9V6a3 3 0 016 0v3" />
													</svg>{' '}
													Make Private
												</>
											) : (
												<>
													<svg
														width="15"
														height="15"
														viewBox="0 0 20 20"
														fill="none"
														stroke="currentColor"
														strokeWidth="1.6"
													>
														<circle
															cx="10"
															cy="10"
															r="8"
														/>
														<path d="M2 10h16M10 2a14 14 0 010 16M10 2a14 14 0 000 16" />
													</svg>{' '}
													Make Public
												</>
											)}
										</button>
										<div className="pd-divider" />
										<button
											className="pd-item pd-danger"
											onClick={handleDelete}
										>
											<svg
												width="15"
												height="15"
												viewBox="0 0 18 18"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.4"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5z"
												/>
											</svg>
											Delete Post
										</button>
									</>
								)}

								{/* ── Everyone ── */}
								{isOwner && <div className="pd-divider" />}
								<button
									className="pd-item"
									onClick={handleSave}
								>
									<svg
										width="15"
										height="15"
										viewBox="0 0 20 20"
										fill={saved ? 'currentColor' : 'none'}
										stroke="currentColor"
										strokeWidth="1.6"
									>
										<path d="M5 2h10a1 1 0 011 1v15l-6-4-6 4V3a1 1 0 011-1z" />
									</svg>
									{saved ? 'Unsave Post' : 'Save Post'}
								</button>
								<button
									className="pd-item"
									onClick={handleShare}
								>
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.8"
									>
										<circle
											cx="18"
											cy="5"
											r="3"
										/>
										<circle
											cx="6"
											cy="12"
											r="3"
										/>
										<circle
											cx="18"
											cy="19"
											r="3"
										/>
										<line
											x1="8.59"
											y1="13.51"
											x2="15.42"
											y2="17.49"
										/>
										<line
											x1="15.41"
											y1="6.51"
											x2="8.59"
											y2="10.49"
										/>
									</svg>
									Copy Link
								</button>
								<button
									className="pd-item"
									onClick={handleHide}
								>
									<svg
										width="15"
										height="15"
										viewBox="0 0 20 20"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.6"
									>
										<path d="M2 2l16 16M8.5 8.6A3 3 0 0011.4 11.5M6.1 6.2C4.2 7.3 2.7 8.9 2 10c1.7 2.8 5 5 8 5a8 8 0 003.9-1.1M10 5c3 0 6.3 2.2 8 5a12 12 0 01-2.1 2.9" />
									</svg>
									Hide Post
								</button>
								{!isOwner && (
									<button
										className={`pd-item ${reported ? 'pd-muted' : 'pd-warn'}`}
										onClick={handleReport}
										disabled={reported}
									>
										<svg
											width="15"
											height="15"
											viewBox="0 0 20 20"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.6"
										>
											<path
												strokeLinecap="round"
												d="M3 3l10 2-2 5 4 3-12 7 3-9-3-8z"
											/>
										</svg>
										{reported ? 'Reported' : 'Report Post'}
									</button>
								)}
							</div>
						)}
					</div>
				</div>

				{post.post_type === 'event' && post.event_title && (
					<div className="post-event-card" style={{cursor:'pointer'}} onClick={() => navigate(`/events/${post.id}`)}>
						{/* image or gradient background */}
						<div
							className="post-event-bg"
							style={{
								backgroundImage: (post.media?.[0]?.url || post.image)
									? `url(${post.media?.[0]?.url || post.image})`
									: undefined
							}}
						>
							<div className="post-event-overlay">
								<div className="post-event-overlay-left">
									<span className="post-event-badge">EVENT</span>
									<div className="post-event-title" style={{cursor:'pointer'}} onClick={() => navigate(`/events/${post.id}`)}>{post.event_title}</div>
									<div className="post-event-meta">
										{post.event_date && (
											<span className="pem-item">
												<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
												{new Date(post.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
											</span>
										)}
										{post.event_location && (
											<span className="pem-item">
												<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
												{post.event_location}
											</span>
										)}
									</div>
									{interestCount > 0 && (
										<span className="post-event-interest-count">&#128587; {interestCount} interested</span>
									)}
								</div>
								{currentUser?.id !== post.author.id && (
									<div className="post-event-overlay-right">
										<button
											className={`event-interest-btn ${isInterested ? 'interested' : ''}`}
											onClick={async (e) => {
												e.stopPropagation()
												try {
													if (isInterested) {
														const res = await api.delete(`/posts/${post.id}/interest/`)
														setIsInterested(false)
														setInterestCount(res.data.interest_count)
													} else {
														const res = await api.post(`/posts/${post.id}/interest/`)
														setIsInterested(true)
														setInterestCount(res.data.interest_count)
													}
												} catch { /* ignore */ }
											}}
										>
											{isInterested ? '✓ Interested' : 'Interested?'}
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{post.post_type === 'article' && post.article_title && (
					<div className="post-article-card">
						<div className="post-article-label">📰 Article</div>
						<div className="post-article-title">{post.article_title}</div>
					</div>
				)}

				<p className="post-content">{post.post_type !== 'event' && postContent}</p>

				{post.post_type !== 'event' && postMedia && postMedia.length > 0 && (
					<div className={`post-media-grid count-${Math.min(postMedia.length, 4)}`}>
						{postMedia.map((m, i) => (
							<div
								key={m.id}
								className="post-media-item media-clickable"
								onClick={() => setViewerIndex(i)}
							>
								{m.media_type === 'video' ? (
									<video src={m.url} />
								) : (
									<img
										src={m.url}
										alt="post"
									/>
								)}
								{m.media_type === 'video' && (
									<div className="media-play-icon">
										<svg
											width="28"
											height="28"
											viewBox="0 0 24 24"
											fill="white"
										>
											<path d="M8 5v14l11-7z" />
										</svg>
									</div>
								)}
							</div>
						))}
					</div>
				)}
				{post.post_type !== 'event' && (!postMedia || postMedia.length === 0) && post.image && (
					<img
						src={post.image}
						alt="post"
						className="post-image media-clickable"
						onClick={() => setViewerIndex(0)}
					/>
				)}
				{post.post_type !== 'event' && (!postMedia || postMedia.length === 0) && post.video && (
					<video
						src={post.video}
						controls
						className="post-video"
					/>
				)}

				{(likes > 0 || commentCount > 0) && (
					<div className="post-counts">
						{likes > 0 && (
							<button onClick={() => setShowLikedBy(!showLikedBy)}>
								<span className="reaction-summary-icons">
									{Object.entries(reactionSummary).slice(0, 3).map(([type]) =>
										<span key={type}>{REACTIONS.find(r => r.type === type)?.emoji}</span>
									)}
								</span>
								{likes} {likes === 1 ? 'reaction' : 'reactions'}
							</button>
						)}
						{commentCount > 0 && (
							<button onClick={() => setShowComments(!showComments)}>
								{commentCount} {commentCount === 1 ? 'comment' : 'comments'}
							</button>
						)}
					</div>
				)}

				{showLikedBy && likedBy.length > 0 && (
					<div className="liked-by-box">
						<span>Liked by: </span>
						{likedBy.map((u) => (
							<span
								key={u.id}
								className="liked-chip"
							>
								{u.first_name} {u.last_name}
							</span>
						))}
					</div>
				)}

				<div className="post-actions">
					<div className="reaction-btn-wrap" ref={reactionBtnRef}
						onMouseEnter={() => { clearTimeout(reactionHoverRef.current); setShowReactionPicker(true) }}
						onMouseLeave={() => { reactionHoverRef.current = setTimeout(() => setShowReactionPicker(false), 300) }}
					>
						{showReactionPicker && (
							<div className="reaction-picker">
								{REACTIONS.map(r => (
									<button
										key={r.type}
										className={`reaction-option ${myReaction === r.type ? 'active' : ''}`}
										onClick={() => handleReact(r.type)}
										title={r.label}
									>
										<span className="reaction-emoji">{r.emoji}</span>
										<span className="reaction-label">{r.label}</span>
									</button>
								))}
							</div>
						)}
						<button
							className={`action-btn ${myReaction ? 'reacted' : ''}`}
							style={myReaction ? { color: REACTIONS.find(r => r.type === myReaction)?.color } : {}}
							onClick={() => handleReact(myReaction || 'like')}
						>
							{myReaction
								? <span style={{ fontSize: '1.1rem' }}>{REACTIONS.find(r => r.type === myReaction)?.emoji}</span>
								: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
							}
							{myReaction ? REACTIONS.find(r => r.type === myReaction)?.label : 'Like'}
						</button>
					</div>
					<button
						className={`action-btn ${showComments ? 'active' : ''}`}
						onClick={() => setShowComments(!showComments)}
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 21 21"
							fill="none"
						>
							<path
								stroke="currentColor"
								d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z"
							/>
						</svg>
						Comment
					</button>
					<button
						className={`action-btn ${copied ? 'active' : ''}`}
						onClick={handleShare}
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<circle
								cx="18"
								cy="5"
								r="3"
							/>
							<circle
								cx="6"
								cy="12"
								r="3"
							/>
							<circle
								cx="18"
								cy="19"
								r="3"
							/>
							<line
								x1="8.59"
								y1="13.51"
								x2="15.42"
								y2="17.49"
							/>
							<line
								x1="15.41"
								y1="6.51"
								x2="8.59"
								y2="10.49"
							/>
						</svg>
						{copied ? 'Copied!' : 'Share'}
					</button>
				</div>

				{showComments && (
					<CommentSection
						postId={post.id}
						initialComments={post.comments}
						currentUser={currentUser}
						onCommentAdded={() => setCommentCount((c) => c + 1)}
					/>
				)}
			</div>
		</>
	)
}

export default PostCard
