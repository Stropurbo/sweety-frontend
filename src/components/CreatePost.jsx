import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const CreatePost = ({ onPostCreated }) => {
	const { user } = useAuth()
	const [tab, setTab] = useState('post')
	const [content, setContent] = useState('')
	const [mediaFiles, setMediaFiles] = useState([])
	const [visibility, setVisibility] = useState('public')
	const [loading, setLoading] = useState(false)
	const [visDropdown, setVisDropdown] = useState(false)
	const [eventTitle, setEventTitle] = useState('')
	const [eventDate, setEventDate] = useState('')
	const [eventLocation, setEventLocation] = useState('')
	const [articleTitle, setArticleTitle] = useState('')
	const dropdownRef = useRef(null)
	const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : ''

	useEffect(() => {
		const handler = (e) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setVisDropdown(false)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const visOptions = [
		{ value: 'public', label: '🌍 Public', desc: 'Everyone can see' },
		{ value: 'private', label: '🔒 Private', desc: 'Only you can see' },
	]
	const selected = visOptions.find(o => o.value === visibility)

	const handleFiles = (e, type) => {
		const files = Array.from(e.target.files)
		setMediaFiles(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), type }))])
		e.target.value = ''
	}

	const removeMedia = (idx) => setMediaFiles(prev => prev.filter((_, i) => i !== idx))

	const canSubmit = () => {
		if (tab === 'post') return content.trim() || mediaFiles.length > 0
		if (tab === 'event') return eventTitle.trim() && eventDate
		if (tab === 'article') return articleTitle.trim() && content.trim()
		return false
	}

	const handleSubmit = async () => {
		if (!canSubmit()) return
		setLoading(true)
		try {
			const fd = new FormData()
			fd.append('post_type', tab)
			fd.append('content', content)
			fd.append('visibility', visibility)
			if (tab === 'event') {
				fd.append('event_title', eventTitle)
				fd.append('event_date', eventDate)
				fd.append('event_location', eventLocation)
			}
			if (tab === 'article') fd.append('article_title', articleTitle)
			mediaFiles.forEach(m => fd.append(m.type === 'image' ? 'images' : 'videos', m.file))
			const res = await api.post('/posts/', fd)
			onPostCreated(res.data)
			setContent(''); setMediaFiles([]); setVisibility('public')
			setEventTitle(''); setEventDate(''); setEventLocation('')
			setArticleTitle(''); setTab('post')
		} catch (err) {
			console.error('Post error:', err.response?.data)
		} finally { setLoading(false) }
	}

	return (
		<div className="create-post-card">
			{/* Input area */}
			<div className="cp-top">
				<div className="cp-avatar" style={{ overflow: 'hidden' }}>
					{user?.avatar
						? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
						: initials}
				</div>
				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
					{tab === 'event' && (
						<>
							<input className="cp-field-input" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event title *" />
							<div style={{ display: 'flex', gap: 8 }}>
								<input className="cp-field-input" type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ flex: 1 }} />
								<input className="cp-field-input" value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="📍 Location" style={{ flex: 1 }} />
							</div>
						</>
					)}
					{tab === 'article' && (
						<input className="cp-field-input cp-article-title" value={articleTitle} onChange={e => setArticleTitle(e.target.value)} placeholder="Article title *" />
					)}
					<textarea
						value={content}
						onChange={e => setContent(e.target.value)}
						placeholder={tab === 'post' ? "What's on your mind?" : tab === 'event' ? 'Describe your event...' : 'Write your article...'}
						rows={tab === 'article' ? 6 : 3}
					/>
				</div>
			</div>

			{/* Media preview */}
			{mediaFiles.length > 0 && (
				<div className="cp-media-grid">
					{mediaFiles.map((m, i) => (
						<div key={i} className="cp-media-item">
							{m.type === 'video' ? <video src={m.preview} controls /> : <img src={m.preview} alt="" />}
							<button className="cp-media-remove" onClick={() => removeMedia(i)}>✕</button>
						</div>
					))}
				</div>
			)}

			{/* Footer — Photo, Video, Event, Article, Privacy, Post button */}
			<div className="cp-footer">
				<div className="cp-actions">
					<label className="cp-btn" title="Photo">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8">
							<rect x="3" y="3" width="18" height="18" rx="3" />
							<circle cx="8.5" cy="8.5" r="1.5" fill="#555" stroke="none" />
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
						</svg>
						<input type="file" accept="image/*" multiple onChange={e => handleFiles(e, 'image')} hidden />
					</label>
					<label className="cp-btn" title="Video">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8">
							<rect x="2" y="6" width="14" height="12" rx="2" />
							<path strokeLinecap="round" strokeLinejoin="round" d="M22 8l-6 4 6 4V8z" />
						</svg>
						<input type="file" accept="video/*" multiple onChange={e => handleFiles(e, 'video')} hidden />
					</label>
					<button className={`cp-btn ${tab === 'event' ? 'cp-btn-active' : ''}`} title="Event" onClick={() => setTab(tab === 'event' ? 'post' : 'event')}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
							<rect x="3" y="4" width="18" height="18" rx="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
					</button>
					<button className={`cp-btn ${tab === 'article' ? 'cp-btn-active' : ''}`} title="Article" onClick={() => setTab(tab === 'article' ? 'post' : 'article')}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
							<path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h10" />
						</svg>
					</button>
					{mediaFiles.length > 0 && (
						<span className="cp-filename">{mediaFiles.length} file{mediaFiles.length > 1 ? 's' : ''}</span>
					)}
					<div className="cp-vis-dropdown" ref={dropdownRef}>
						<button type="button" className="cp-vis-btn" onClick={() => setVisDropdown(!visDropdown)}>
							{selected.label}
							<svg width="10" height="6" viewBox="0 0 10 6" fill="none">
								<path fill="#555" d="M5 5l.354.354L5 5.707l-.354-.353L5 5zm4.354-3.646l-4 4-.708-.708 4-4 .708.708zm-4.708 4l-4-4 .708-.708 4 4-.708.708z" />
							</svg>
						</button>
						{visDropdown && (
							<div className="cp-vis-menu">
								{visOptions.map(o => (
									<button key={o.value} className={`cp-vis-option ${visibility === o.value ? 'active' : ''}`}
										onClick={() => { setVisibility(o.value); setVisDropdown(false) }}>
										<span className="vis-label">{o.label}</span>
										<span className="vis-desc">{o.desc}</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
				<button className="cp-submit" onClick={handleSubmit} disabled={loading || !canSubmit()}>
					{loading ? <span className="spinner" /> : tab === 'event' ? 'Create Event' : tab === 'article' ? 'Publish' : 'Post'}
				</button>
			</div>
		</div>
	)
}

export default CreatePost
