import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import '../styles/event-detail.css'

const REACTIONS = [
	{ type: 'like',  emoji: '👍', label: 'Like',  color: '#1890ff' },
	{ type: 'love',  emoji: '❤️', label: 'Love',  color: '#f5222d' },
	{ type: 'haha',  emoji: '😂', label: 'Haha',  color: '#faad14' },
	{ type: 'wow',   emoji: '😮', label: 'Wow',   color: '#faad14' },
	{ type: 'sad',   emoji: '😢', label: 'Sad',   color: '#faad14' },
	{ type: 'angry', emoji: '😡', label: 'Angry', color: '#ff4d4f' },
]

const EventDetail = () => {
	const { id } = useParams()
	const { user } = useAuth()
	const navigate = useNavigate()
	const [event, setEvent] = useState(null)
	const [loading, setLoading] = useState(true)
	const [isInterested, setIsInterested] = useState(false)
	const [interestCount, setInterestCount] = useState(0)
	const [myReaction, setMyReaction] = useState(null)
	const [reactionSummary, setReactionSummary] = useState({})
	const [likes, setLikes] = useState(0)
	const [showReactionPicker, setShowReactionPicker] = useState(false)
	const [comment, setComment] = useState('')
	const [comments, setComments] = useState([])
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		api.get(`/posts/${id}/`).then(r => {
			const e = r.data
			setEvent(e)
			setIsInterested(e.is_interested || false)
			setInterestCount(e.interest_count || 0)
			setMyReaction(e.my_reaction || null)
			setReactionSummary(e.reaction_summary || {})
			setLikes(e.likes_count || 0)
			setComments(e.comments || [])
		}).catch(() => navigate('/feed'))
		.finally(() => setLoading(false))
	}, [id])

	const toggleInterest = async () => {
		try {
			if (isInterested) {
				const res = await api.delete(`/posts/${id}/interest/`)
				setIsInterested(false)
				setInterestCount(res.data.interest_count)
			} else {
				const res = await api.post(`/posts/${id}/interest/`)
				setIsInterested(true)
				setInterestCount(res.data.interest_count)
			}
		} catch {}
	}

	const handleReact = async (type) => {
		setShowReactionPicker(false)
		try {
			const res = await api.post(`/posts/${id}/react/`, { reaction_type: type })
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
		} catch {}
	}

	const handleComment = async (e) => {
		e.preventDefault()
		if (!comment.trim()) return
		setSubmitting(true)
		try {
			const res = await api.post(`/posts/${id}/comments/`, { content: comment })
			setComments(prev => [...prev, res.data])
			setComment('')
		} catch {}
		setSubmitting(false)
	}

	if (loading) return (
		<div className="app-wrap">
			<Navbar />
			<div className="ed-loading">
				<div className="ed-skeleton" />
			</div>
		</div>
	)

	if (!event) return null

	const isOwner = user?.id === event.author?.id
	const coverImage = event.media?.[0]?.url || event.image
	const authorInitials = event.author ? `${event.author.first_name[0]}${event.author.last_name[0]}`.toUpperCase() : ''
	const formattedDate = event.event_date
		? new Date(event.event_date).toLocaleString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
		: null

	return (
		<div className="app-wrap">
			<Navbar />
			<div className="ed-wrap">
				{/* Cover */}
				<div className="ed-cover" style={{ backgroundImage: coverImage ? `url(${coverImage})` : undefined }}>
					{!coverImage && <div className="ed-cover-placeholder" />}
					<div className="ed-cover-overlay">
						<button className="ed-back-btn" onClick={() => navigate(-1)}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
							Back
						</button>
						<div className="ed-cover-badge">EVENT</div>
					</div>
				</div>

				<div className="ed-body">
					<div className="ed-main">
						{/* Title + Actions */}
						<div className="ed-header-card">
							<h1 className="ed-title">{event.event_title}</h1>
							<div className="ed-meta-row">
								{formattedDate && (
									<div className="ed-meta-item">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
										<span>{formattedDate}</span>
									</div>
								)}
								{event.event_location && (
									<div className="ed-meta-item">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
										<span>{event.event_location}</span>
									</div>
								)}
								<div className="ed-meta-item">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
									<span>{interestCount} interested</span>
								</div>
							</div>

							{/* Action buttons */}
							<div className="ed-actions">
								{!isOwner && (
									<button
										className={`ed-interest-btn ${isInterested ? 'active' : ''}`}
										onClick={toggleInterest}
									>
										{isInterested ? '✓ Interested' : '🙋 Interested?'}
									</button>
								)}

								{/* Reaction */}
								<div className="ed-reaction-wrap"
									onMouseEnter={() => setShowReactionPicker(true)}
									onMouseLeave={() => setShowReactionPicker(false)}
								>
									{showReactionPicker && (
										<div className="ed-reaction-picker">
											{REACTIONS.map(r => (
												<button key={r.type}
													className={`ed-reaction-opt ${myReaction === r.type ? 'active' : ''}`}
													onClick={() => handleReact(r.type)}
													title={r.label}
												>
													<span>{r.emoji}</span>
													<span>{r.label}</span>
												</button>
											))}
										</div>
									)}
									<button
										className={`ed-react-btn ${myReaction ? 'reacted' : ''}`}
										style={myReaction ? { color: REACTIONS.find(r => r.type === myReaction)?.color } : {}}
										onClick={() => handleReact(myReaction || 'like')}
									>
										{myReaction
											? <span style={{ fontSize: '1.1rem' }}>{REACTIONS.find(r => r.type === myReaction)?.emoji}</span>
											: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
										}
										{myReaction ? REACTIONS.find(r => r.type === myReaction)?.label : 'Like'}
										{likes > 0 && <span className="ed-react-count">{likes}</span>}
									</button>
								</div>
							</div>

							{/* Reaction summary */}
							{Object.keys(reactionSummary).length > 0 && (
								<div className="ed-reaction-summary">
									{Object.entries(reactionSummary).map(([type, count]) => (
										<span key={type} className="ed-reaction-chip">
											{REACTIONS.find(r => r.type === type)?.emoji} {count}
										</span>
									))}
								</div>
							)}
						</div>

						{/* Description */}
						{event.content && (
							<div className="ed-card">
								<h3 className="ed-card-title">About this event</h3>
								<p className="ed-description">{event.content}</p>
							</div>
						)}

						{/* Comments */}
						<div className="ed-card">
							<h3 className="ed-card-title">Comments ({comments.length})</h3>
							<form className="ed-comment-form" onSubmit={handleComment}>
								<div className="ed-comment-avatar">
									{user?.avatar
										? <img src={user.avatar} alt="" />
										: <span>{user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : ''}</span>
									}
								</div>
								<input
									value={comment}
									onChange={e => setComment(e.target.value)}
									placeholder="Write a comment..."
									className="ed-comment-input"
								/>
								<button type="submit" disabled={submitting || !comment.trim()} className="ed-comment-submit">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
								</button>
							</form>
							<div className="ed-comments-list">
								{comments.map(c => {
									const ci = `${c.author.first_name[0]}${c.author.last_name[0]}`.toUpperCase()
									return (
										<div key={c.id} className="ed-comment-item">
											<div className="ed-comment-avatar sm">
												{c.author.avatar
													? <img src={c.author.avatar} alt="" />
													: <span>{ci}</span>
												}
											</div>
											<div className="ed-comment-bubble">
												<strong>{c.author.first_name} {c.author.last_name}</strong>
												<p>{c.content}</p>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="ed-sidebar">
						{/* Organizer */}
						<div className="ed-card">
							<h3 className="ed-card-title">Organizer</h3>
							<div className="ed-organizer" onClick={() => navigate(`/profile/${event.author.id}`)}>
								<div className="ed-org-avatar">
									{event.author.avatar
										? <img src={event.author.avatar} alt="" />
										: <span>{authorInitials}</span>
									}
								</div>
								<div>
									<strong>{event.author.first_name} {event.author.last_name}</strong>
									<span>Event Organizer</span>
								</div>
							</div>
						</div>

						{/* Date & Time */}
						{formattedDate && (
							<div className="ed-card">
								<h3 className="ed-card-title">Date & Time</h3>
								<div className="ed-info-row">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1890ff" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
									<span>{formattedDate}</span>
								</div>
							</div>
						)}

						{/* Location */}
						{event.event_location && (
							<div className="ed-card">
								<h3 className="ed-card-title">Location</h3>
								<div className="ed-info-row">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1890ff" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
									<span>{event.event_location}</span>
								</div>
							</div>
						)}

						{/* Visibility */}
						<div className="ed-card">
							<h3 className="ed-card-title">Visibility</h3>
							<div className="ed-info-row">
								{event.visibility === 'public'
									? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg><span style={{color:'#52c41a', fontWeight:600}}>Public Event</span></>
									: <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fa8c16" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><span style={{color:'#fa8c16', fontWeight:600}}>Private Event</span></>
								}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default EventDetail
