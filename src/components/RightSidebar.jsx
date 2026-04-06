import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import usePolling from '../hooks/usePolling'

const FriendItem = ({ f, onUnfriend, navigate }) => {
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const dropRef = useRef(null)
	const initials = `${f.first_name[0]}${f.last_name[0]}`.toUpperCase()

	useEffect(() => {
		const handler = (e) => {
			if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const handleUnfriend = async () => {
		if (loading) return
		setLoading(true)
		try {
			await api.delete(`/friends/unfriend/${f.id}/`)
			onUnfriend(f.id)
		} catch {}
		setLoading(false)
		setOpen(false)
	}

	return (
		<div
			className="friend-item"
			style={{ cursor: 'pointer' }}
		>
			<div
				className="friend-avatar-wrap"
				onClick={() => navigate(`/profile/${f.id}`)}
			>
				{f.avatar ? (
					<img
						src={f.avatar}
						alt=""
						className="friend-avatar"
					/>
				) : (
					<div
						className="friend-avatar suggest-avatar-initials"
						style={{ width: 36, height: 36, fontSize: '0.75rem' }}
					>
						{initials}
					</div>
				)}
				<span className={`online-dot ${f.is_online ? 'on' : 'off'}`} />
			</div>
			<span
				className="friend-name"
				onClick={() => navigate(`/profile/${f.id}`)}
			>
				{f.first_name} {f.last_name}
			</span>
			{f.is_online && (
				<span style={{ fontSize: '0.72rem', color: '#0ACF83', fontWeight: 600 }}>
					Active
				</span>
			)}

			<div
				className="friend-menu-wrap"
				ref={dropRef}
			>
				<button
					className="friend-menu-btn"
					onClick={() => setOpen((o) => !o)}
				>
					<svg
						width="14"
						height="14"
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
				{open && (
					<div className="friend-dropdown">
						<button
							onClick={() => {
								navigate(`/profile/${f.id}`)
								setOpen(false)
							}}
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
								<circle
									cx="12"
									cy="7"
									r="4"
								/>
							</svg>
							View Profile
						</button>
						<div className="friend-dropdown-divider" />
						<button
							className="friend-dropdown-danger"
							onClick={handleUnfriend}
							disabled={loading}
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
							</svg>
							{loading ? 'Removing...' : 'Unfriend'}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

const RightSidebar = ({ posts }) => {
	const { user: currentUser } = useAuth()
	const navigate = useNavigate()
	const [suggested, setSuggested] = useState([])
	const [friends, setFriends] = useState([])

	const fetchSuggested = useCallback(() => {
		api.get('/auth/suggested/')
			.then((res) => setSuggested(res.data))
			.catch(() => {})
	}, [])

	const fetchFriends = useCallback(() => {
		if (!currentUser) return
		api.get(`/friends/list/${currentUser.id}/`)
			.then((res) => setFriends(res.data))
			.catch(() => {})
	}, [currentUser])

	useEffect(() => {
		fetchSuggested()
	}, [fetchSuggested])
	useEffect(() => {
		fetchFriends()
	}, [fetchFriends])
	usePolling(fetchFriends, 10000)
	usePolling(fetchSuggested, 60000)

	const handleUnfriend = (id) => setFriends((prev) => prev.filter((f) => f.id !== id))

	return (
		<aside className="sidebar-right">
			{suggested.length > 0 && (
				<div className="sidebar-card">
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '1rem',
						}}
					>
						<h4
							className="sidebar-title"
							style={{ margin: 0 }}
						>
							You Might Like
						</h4>
						<span
							onClick={() => navigate('/find-friends')}
							style={{
								fontSize: '0.82rem',
								fontWeight: 600,
								color: '#1890ff',
								cursor: 'pointer',
							}}
						>
							See all
						</span>
					</div>
					{suggested.map((u) => {
						const initials = `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
						return (
							<div
								key={u.id}
								className="suggest-item"
							>
								<div
									className="suggest-avatar-wrap"
									onClick={() => navigate(`/profile/${u.id}`)}
								>
									{u.avatar ? (
										<img
											src={u.avatar}
											alt=""
											className="suggest-avatar"
										/>
									) : (
										<div className="suggest-avatar suggest-avatar-initials">
											{initials}
										</div>
									)}
								</div>
								<div
									className="suggest-info"
									onClick={() => navigate(`/profile/${u.id}`)}
								>
									<strong>
										{u.first_name} {u.last_name}
									</strong>
									<span>
										{u.bio
											? u.bio.slice(0, 32) +
												(u.bio.length > 32 ? '…' : '')
											: 'Member'}
									</span>
								</div>
								<button
									className="btn-connect"
									onClick={() => navigate(`/profile/${u.id}`)}
								>
									View
								</button>
							</div>
						)
					})}
				</div>
			)}

			{friends.length > 0 && (
				<div className="sidebar-card">
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '1rem',
						}}
					>
						<h4
							className="sidebar-title"
							style={{ margin: 0 }}
						>
							Your Friends
						</h4>
						<span
							onClick={() => navigate(`/friends/${currentUser?.id}`)}
							style={{
								fontSize: '0.82rem',
								fontWeight: 600,
								color: '#1890ff',
								cursor: 'pointer',
							}}
						>
							See All
						</span>
					</div>
					{friends.map((f) => (
						<FriendItem
							key={f.id}
							f={f}
							onUnfriend={handleUnfriend}
							navigate={navigate}
						/>
					))}
				</div>
			)}
		</aside>
	)
}

export default RightSidebar
