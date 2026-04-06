import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const Avatar = ({ user, size = 36 }) => {
	const navigate = useNavigate()
	const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
	return (
		<div
			onClick={() => navigate(`/profile/${user.id}`)}
			style={{
				width: size, height: size, borderRadius: '50%', flexShrink: 0,
				background: user.avatar ? 'transparent' : 'linear-gradient(135deg,#1890ff,#722ed1)',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				overflow: 'hidden', cursor: 'pointer', fontSize: size * 0.33,
				fontWeight: 700, color: '#fff',
			}}
		>
			{user.avatar
				? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
				: initials}
		</div>
	)
}

const ThreeDotMenu = ({ onEdit, onDelete }) => {
	const [open, setOpen] = useState(false)
	const ref = useRef(null)

	useEffect(() => {
		const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	return (
		<div ref={ref} className="c-dot-wrap">
			<button className="c-dot-btn" onClick={() => setOpen(o => !o)}>
				<svg width="12" height="12" viewBox="0 0 4 16" fill="currentColor">
					<circle cx="2" cy="2" r="1.5" />
					<circle cx="2" cy="8" r="1.5" />
					<circle cx="2" cy="14" r="1.5" />
				</svg>
			</button>
			{open && (
				<div className="c-dot-menu">
					<button onClick={() => { onEdit(); setOpen(false) }}>
						<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
							<path d="M14.7 2.3a1 1 0 011.4 1.4l-1.4 1.4-1.4-1.4 1.4-1.4zM2 14l1-4L12.3 4.7l3 3L6 17l-4 1z" />
						</svg>
						Edit
					</button>
					<button className="c-dot-delete" onClick={() => { onDelete(); setOpen(false) }}>
						<svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4">
							<path strokeLinecap="round" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5z" />
						</svg>
						Delete
					</button>
				</div>
			)}
		</div>
	)
}

const ReplyItem = ({ reply, currentUser, onDelete }) => {
	const navigate = useNavigate()
	const [likes, setLikes] = useState(reply.likes_count)
	const [isLiked, setIsLiked] = useState(reply.is_liked)
	const [editing, setEditing] = useState(false)
	const [editText, setEditText] = useState(reply.content)
	const [content, setContent] = useState(reply.content)
	const isOwner = currentUser?.id === reply.author.id

	const handleLike = async () => {
		try {
			const res = await api.post(`/posts/replies/${reply.id}/like/`)
			setLikes(res.data.likes_count)
			setIsLiked(res.data.liked)
		} catch {}
	}

	const handleDelete = async () => {
		if (!window.confirm('Delete this reply?')) return
		try {
			await api.delete(`/posts/replies/${reply.id}/`)
			onDelete(reply.id)
		} catch {}
	}

	const handleEdit = async () => {
		if (!editText.trim()) return
		try {
			await api.patch(`/posts/replies/${reply.id}/`, { content: editText })
			setContent(editText)
			setEditing(false)
		} catch {}
	}

	return (
		<div className="reply-item">
			<Avatar user={reply.author} size={28} />
			<div className="c-body">
				{editing ? (
					<div className="c-edit-wrap">
						<input
							value={editText}
							onChange={e => setEditText(e.target.value)}
							onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false) }}
							autoFocus className="c-edit-input"
						/>
						<div className="c-edit-actions">
							<button onClick={() => setEditing(false)}>Cancel</button>
							<button onClick={handleEdit} className="c-edit-save">Save</button>
						</div>
					</div>
				) : (
					<div className="c-bubble">
						<div className="c-bubble-header">
							<strong onClick={() => navigate(`/profile/${reply.author.id}`)} style={{ cursor: 'pointer' }}>
								{reply.author.first_name} {reply.author.last_name}
							</strong>
							{isOwner && (
								<ThreeDotMenu onEdit={() => setEditing(true)} onDelete={handleDelete} />
							)}
						</div>
						<p>{content}</p>
					</div>
				)}
				<div className="c-actions">
					<button className={isLiked ? 'liked' : ''} onClick={handleLike}>
						{isLiked ? '❤️' : 'Like'} {likes > 0 && <span>{likes}</span>}
					</button>
				</div>
			</div>
		</div>
	)
}

const CommentItem = ({ comment, currentUser, onDelete }) => {
	const navigate = useNavigate()
	const [likes, setLikes] = useState(comment.likes_count)
	const [isLiked, setIsLiked] = useState(comment.is_liked)
	const [showReplies, setShowReplies] = useState(false)
	const [replies, setReplies] = useState(comment.replies || [])
	const [replyText, setReplyText] = useState('')
	const [showReplyInput, setShowReplyInput] = useState(false)
	const [editing, setEditing] = useState(false)
	const [editText, setEditText] = useState(comment.content)
	const [content, setContent] = useState(comment.content)
	const replyInputRef = useRef(null)
	const isOwner = currentUser?.id === comment.author.id

	const handleLike = async () => {
		try {
			const res = await api.post(`/posts/comments/${comment.id}/like/`)
			setLikes(res.data.likes_count)
			setIsLiked(res.data.liked)
		} catch {}
	}

	const handleDelete = async () => {
		if (!window.confirm('Delete this comment?')) return
		try {
			await api.delete(`/posts/comments/${comment.id}/`)
			onDelete(comment.id)
		} catch {}
	}

	const handleEdit = async () => {
		if (!editText.trim()) return
		try {
			await api.patch(`/posts/comments/${comment.id}/`, { content: editText })
			setContent(editText)
			setEditing(false)
		} catch {}
	}

	const handleReply = async () => {
		if (!replyText.trim()) return
		try {
			const res = await api.post(`/posts/comments/${comment.id}/replies/`, { content: replyText })
			setReplies(prev => [...prev, res.data])
			setReplyText('')
			setShowReplies(true)
			setShowReplyInput(false)
		} catch {}
	}

	const handleReplyClick = () => {
		setShowReplyInput(true)
		setReplyText('')
		setTimeout(() => replyInputRef.current?.focus(), 50)
	}

	return (
		<div className="comment-item">
			<Avatar user={comment.author} size={36} />
			<div className="c-body">
				{editing ? (
					<div className="c-edit-wrap">
						<input
							value={editText}
							onChange={e => setEditText(e.target.value)}
							onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false) }}
							autoFocus className="c-edit-input"
						/>
						<div className="c-edit-actions">
							<button onClick={() => setEditing(false)}>Cancel</button>
							<button onClick={handleEdit} className="c-edit-save">Save</button>
						</div>
					</div>
				) : (
					<div className="c-bubble">
						<div className="c-bubble-header">
							<strong onClick={() => navigate(`/profile/${comment.author.id}`)} style={{ cursor: 'pointer' }}>
								{comment.author.first_name} {comment.author.last_name}
							</strong>
							{isOwner && (
								<ThreeDotMenu onEdit={() => setEditing(true)} onDelete={handleDelete} />
							)}
						</div>
						<p>{content}</p>
					</div>
				)}

				<div className="c-actions">
					<button className={isLiked ? 'liked' : ''} onClick={handleLike}>
						{isLiked ? '❤️' : 'Like'} {likes > 0 && <span>{likes}</span>}
					</button>
					<button onClick={handleReplyClick}>Reply</button>
					{replies.length > 0 && (
						<button onClick={() => setShowReplies(v => !v)}>
							{showReplies ? '▲ Hide replies' : `▼ ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
						</button>
					)}
				</div>

				{showReplyInput && (
					<div className="reply-form">
						<Avatar user={currentUser} size={28} />
						<div className="comment-input-wrap">
							<input
								ref={replyInputRef}
								value={replyText}
								onChange={e => setReplyText(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() }
									if (e.key === 'Escape') setShowReplyInput(false)
								}}
								placeholder={`Reply to ${comment.author.first_name}...`}
							/>
							<button onClick={handleReply} disabled={!replyText.trim()}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
								</svg>
							</button>
						</div>
					</div>
				)}

				{showReplies && replies.length > 0 && (
					<div className="replies-list">
						{replies.map(r => (
							<ReplyItem
								key={r.id}
								reply={r}
								currentUser={currentUser}
								onDelete={(id) => setReplies(prev => prev.filter(x => x.id !== id))}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

const CommentSection = ({ postId, initialComments, currentUser, onCommentAdded }) => {
	const [comments, setComments] = useState(initialComments || [])
	const [text, setText] = useState('')

	const handleComment = async () => {
		if (!text.trim()) return
		try {
			const res = await api.post(`/posts/${postId}/comments/`, { content: text })
			setComments(prev => [...prev, res.data])
			setText('')
			onCommentAdded?.()
		} catch {}
	}

	return (
		<div className="comment-section">
			<div className="comment-input-row">
				<Avatar user={currentUser} size={36} />
				<div className="comment-input-wrap">
					<input
						value={text}
						onChange={e => setText(e.target.value)}
						onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
						placeholder="Write a comment... (Enter to send)"
					/>
					<button onClick={handleComment} disabled={!text.trim()}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
						</svg>
					</button>
				</div>
			</div>
			<div className="comments-list">
				{comments.map(c => (
					<CommentItem
						key={c.id}
						comment={c}
						currentUser={currentUser}
						onDelete={(id) => setComments(prev => prev.filter(x => x.id !== id))}
					/>
				))}
			</div>
		</div>
	)
}

export default CommentSection
