import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import usePolling from '../hooks/usePolling'

const BG_COLORS = ['#1890ff', '#722ed1', '#eb2f96', '#fa541c', '#52c41a', '#faad14', '#13c2c2', '#f5222d']

// ── Story Viewer Modal ──
const StoryViewer = ({ stories, startIndex, onClose, currentUser, onDelete }) => {
	const [idx, setIdx] = useState(startIndex)
	const [progress, setProgress] = useState(0)
	const [paused, setPaused] = useState(false)
	const timerRef = useRef(null)
	const pausedAtRef = useRef(0)
	const startTimeRef = useRef(0)
	const story = stories[idx]
	const DURATION = 5000

	const startTimer = (startFrom = 0) => {
		clearInterval(timerRef.current)
		startTimeRef.current = Date.now() - startFrom
		timerRef.current = setInterval(() => {
			const elapsed = Date.now() - startTimeRef.current
			const pct = Math.min((elapsed / DURATION) * 100, 100)
			setProgress(pct)
			if (pct >= 100) {
				clearInterval(timerRef.current)
				if (idx < stories.length - 1) setIdx(i => i + 1)
				else onClose()
			}
		}, 50)
	}

	useEffect(() => {
		setProgress(0)
		setPaused(false)
		pausedAtRef.current = 0
		startTimer(0)
		return () => clearInterval(timerRef.current)
	}, [idx])

	const togglePause = () => {
		if (paused) {
			setPaused(false)
			startTimer(pausedAtRef.current)
		} else {
			clearInterval(timerRef.current)
			pausedAtRef.current = (progress / 100) * DURATION
			setPaused(true)
		}
	}

	const goNext = () => { clearInterval(timerRef.current); if (idx < stories.length - 1) setIdx(i => i + 1); else onClose() }
	const goPrev = () => { clearInterval(timerRef.current); if (idx > 0) setIdx(i => i - 1) }
	const initials = `${story.author.first_name[0]}${story.author.last_name[0]}`.toUpperCase()

	return (
		<div className="sv-overlay" onClick={onClose}>
			<div className="sv-box" onClick={e => e.stopPropagation()}>
				{/* progress bars */}
				<div className="sv-progress-row">
					{stories.map((_, i) => (
						<div key={i} className="sv-progress-track">
							<div className="sv-progress-fill" style={{ width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }} />
						</div>
					))}
				</div>

				{/* header */}
				<div className="sv-header">
					<div className="sv-author">
						<div className="sv-author-avatar">
							{story.author.avatar
								? <img src={story.author.avatar} alt="" />
								: <span>{initials}</span>}
						</div>
						<div>
							<strong>{story.author.first_name} {story.author.last_name}</strong>
							<span>{new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
						</div>
					</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button className="sv-pause-btn" title={paused ? 'Resume' : 'Pause'} onClick={togglePause}>
							{paused ? (
								<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
							) : (
								<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
							)}
						</button>
						{currentUser?.id === story.author.id && (
							<button className="sv-delete-btn" title="Delete story" onClick={() => { onDelete(story.id); onClose() }}>🗑</button>
						)}
						<button className="sv-close-btn" title="Close" onClick={onClose}>✕</button>
					</div>
				</div>

				{/* content */}
				<div className="sv-content" style={{ background: story.image ? '#000' : story.bg_color }}>
					{story.image
						? <img src={story.image} alt="" className="sv-img" />
						: <p className="sv-text">{story.text}</p>}
					{story.image && story.text && <p className="sv-caption">{story.text}</p>}
				</div>

				{/* nav */}
				{idx > 0 && <button className="sv-nav sv-prev" onClick={goPrev}>‹</button>}
				{idx < stories.length - 1 && <button className="sv-nav sv-next" onClick={goNext}>›</button>}
			</div>
		</div>
	)
}

// ── Create Story Modal ──
const CreateStoryModal = ({ onClose, onCreated }) => {
	const [tab, setTab] = useState('image') // 'image' | 'text'
	const [file, setFile] = useState(null)
	const [preview, setPreview] = useState(null)
	const [text, setText] = useState('')
	const [bgColor, setBgColor] = useState('#1890ff')
	const [uploading, setUploading] = useState(false)

	const handleFile = (e) => {
		const f = e.target.files[0]; if (!f) return
		setFile(f)
		setPreview(URL.createObjectURL(f))
		e.target.value = ''
	}

	const handleCreate = async () => {
		if (tab === 'image' && !file) return
		if (tab === 'text' && !text.trim()) return
		setUploading(true)
		try {
			const fd = new FormData()
			if (tab === 'image' && file) fd.append('image', file)
			if (text.trim()) fd.append('text', text.trim())
			fd.append('bg_color', bgColor)
			const res = await api.post('/posts/stories/', fd)
			onCreated(res.data)
			onClose()
		} catch { setUploading(false) }
	}

	return (
		<div className="sv-overlay" onClick={onClose}>
			<div className="cs-box" onClick={e => e.stopPropagation()}>
				<div className="cs-header">
					<strong>Create Story</strong>
					<button onClick={onClose}>✕</button>
				</div>

				<div className="cs-tabs">
					<button className={tab === 'image' ? 'active' : ''} onClick={() => setTab('image')}>📷 Photo</button>
					<button className={tab === 'text' ? 'active' : ''} onClick={() => setTab('text')}>✏️ Text</button>
				</div>

				{tab === 'image' && (
					<div className="cs-body">
						{preview ? (
							<div className="cs-preview">
								<img src={preview} alt="" />
								<button className="cs-remove-img" onClick={() => { setFile(null); setPreview(null) }}>✕</button>
							</div>
						) : (
							<label className="cs-upload-area">
								<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
									<rect x="3" y="3" width="18" height="18" rx="3" />
									<circle cx="8.5" cy="8.5" r="1.5" />
									<path d="M21 15l-5-5L5 21" />
								</svg>
								<span>Click to upload photo</span>
								<input type="file" accept="image/*" onChange={handleFile} hidden />
							</label>
						)}
						<input
							className="cs-caption-input"
							value={text}
							onChange={e => setText(e.target.value)}
							placeholder="Add a caption... (optional)"
							maxLength={200}
						/>
					</div>
				)}

				{tab === 'text' && (
					<div className="cs-body">
						<div className="cs-text-preview" style={{ background: bgColor }}>
							<textarea
								value={text}
								onChange={e => setText(e.target.value)}
								placeholder="What's on your mind?"
								maxLength={200}
								className="cs-text-input"
							/>
						</div>
						<div className="cs-colors">
							{BG_COLORS.map(c => (
								<button
									key={c}
									className={`cs-color-btn ${bgColor === c ? 'active' : ''}`}
									style={{ background: c }}
									onClick={() => setBgColor(c)}
								/>
							))}
						</div>
					</div>
				)}

				<div className="cs-footer">
					<button className="cs-cancel" onClick={onClose}>Cancel</button>
					<button
						className="cs-submit"
						onClick={handleCreate}
						disabled={uploading || (tab === 'image' ? !file : !text.trim())}
					>
						{uploading ? 'Posting...' : 'Share Story'}
					</button>
				</div>
			</div>
		</div>
	)
}

// ── Story Bar ──
const StoryBar = () => {
	const { user } = useAuth()
	const [stories, setStories] = useState([])
	const [viewerData, setViewerData] = useState(null) // { stories, startIndex }
	const [showCreate, setShowCreate] = useState(false)

	const fetchStories = useCallback(() => {
		api.get('/posts/stories/').then(res => setStories(res.data)).catch(() => {})
	}, [])

	useEffect(() => { fetchStories() }, [fetchStories])
	usePolling(fetchStories, 5000)

	// group stories by author
	const grouped = stories.reduce((acc, s) => {
		const id = s.author.id
		if (!acc[id]) acc[id] = { author: s.author, stories: [] }
		acc[id].stories.push(s)
		return acc
	}, {})
	const groups = Object.values(grouped)

	const myGroup = groups.find(g => g.author.id === user?.id)
	const othersGroups = groups.filter(g => g.author.id !== user?.id)
	const orderedGroups = myGroup ? [myGroup, ...othersGroups] : othersGroups

	const handleDelete = async (id) => {
		try {
			await api.delete(`/posts/stories/${id}/`)
			setStories(prev => prev.filter(s => s.id !== id))
		} catch {}
	}

	const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : ''

	return (
		<>
			<div className="story-bar">
				{/* Add Story card */}
				<div className="story-card story-add-card" onClick={() => setShowCreate(true)}>
					<div className="story-add-img">
						{user?.avatar
							? <img src={user.avatar} alt="" />
							: <span>{initials}</span>}
						<div className="story-add-plus">+</div>
					</div>
					<span>Add Story</span>
				</div>

				{/* Other story cards */}
				{orderedGroups.map(g => {
					const latest = g.stories[0]
					const gi = `${g.author.first_name[0]}${g.author.last_name[0]}`.toUpperCase()
					const isMe = g.author.id === user?.id
					return (
						<div
							key={g.author.id}
							className="story-card"
							onClick={() => setViewerData({ stories: g.stories, startIndex: 0 })}
						>
							<div className="story-thumb" style={{ background: latest.image ? '#000' : latest.bg_color }}>
								{latest.image
									? <img src={latest.image} alt="" />
									: <p className="story-thumb-text">{latest.text}</p>}
								<div className="story-avatar-ring">
									{g.author.avatar
										? <img src={g.author.avatar} alt="" />
										: <span>{gi}</span>}
								</div>
							</div>
							<span>{isMe ? 'Your Story' : g.author.first_name}</span>
						</div>
					)
				})}
			</div>

			{viewerData && (
				<StoryViewer
					stories={viewerData.stories}
					startIndex={viewerData.startIndex}
					onClose={() => setViewerData(null)}
					currentUser={user}
					onDelete={handleDelete}
				/>
			)}

			{showCreate && (
				<CreateStoryModal
					onClose={() => setShowCreate(false)}
					onCreated={(s) => setStories(prev => [s, ...prev])}
				/>
			)}
		</>
	)
}

export default StoryBar
