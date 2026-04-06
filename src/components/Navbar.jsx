import { useState, useRef, useEffect, startTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import api from '../api/axios'

const timeAgo = (dateStr) => {
	const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
	if (diff < 60) return 'just now'
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
	return `${Math.floor(diff / 86400)}d ago`
}

const NOTIF_TEXT = {
	like_post: 'liked your post',
	like_comment: 'liked your comment',
	like_reply: 'liked your reply',
	comment: 'commented on your post',
	reply: 'replied to your comment',
	friend_request: 'sent you a friend request',
	friend_accept: 'accepted your friend request',
}

const Navbar = () => {
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [profileOpen, setProfileOpen] = useState(false)
	const [notifOpen, setNotifOpen] = useState(false)
	const [activeTab, setActiveTab] = useState('all')
	const [notifications, setNotifications] = useState([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [searchLoading, setSearchLoading] = useState(false)
	const [showSearchDrop, setShowSearchDrop] = useState(false)
	const searchTimeout = useRef(null)
	const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : ''

	const notifRef = useRef(null)
	const profileRef = useRef(null)

	useEffect(() => {
		if (!user) return
		const fetchNotifs = async () => {
			try {
				const res = await api.get('/notifications/')
				startTransition(() => {
					setNotifications(res.data.notifications)
					setUnreadCount(res.data.unread_count)
				})
			} catch { /* ignore */ }
		}
		fetchNotifs()
		const interval = setInterval(fetchNotifs, 30000)
		return () => clearInterval(interval)
	}, [user])

	const handleSearch = (q) => {
		setSearchQuery(q)
		clearTimeout(searchTimeout.current)
		if (!q.trim()) { setSearchResults([]); setShowSearchDrop(false); return }
		setShowSearchDrop(true)
		setSearchLoading(true)
		searchTimeout.current = setTimeout(async () => {
			try {
				const res = await api.get(`/auth/search/?q=${encodeURIComponent(q)}`)
				setSearchResults(res.data)
			} catch {}
			setSearchLoading(false)
		}, 400)
	}

	const handleMarkAllRead = async () => {
		await api.post('/notifications/read/')
		startTransition(() => {
			setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
			setUnreadCount(0)
		})
	}

	useEffect(() => {
		const handleOutside = (e) => {
			if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
			if (profileRef.current && !profileRef.current.contains(e.target))
				setProfileOpen(false)
		}
		document.addEventListener('mousedown', handleOutside)
		return () => document.removeEventListener('mousedown', handleOutside)
	}, [])

	const filtered =
		activeTab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

	return (
		<header className="topbar">
			<div className="topbar-inner">
				<div className="topbar-left">
					<Link
						to="/"
						className="topbar-brand"
					>
						<img
							src="/sweety-icon.svg"
							alt="Sweety"
							className="topbar-icon"
						/>
						<span className="topbar-name">Sweety</span>
					</Link>

	{/* searchbar */}
					<div className="topbar-search" style={{ position: 'relative' }}>
						<svg width="16" height="16" viewBox="0 0 17 17" fill="none">
							<circle cx="7" cy="7" r="6" stroke="#999" />
							<path stroke="#999" strokeLinecap="round" d="M16 16l-3-3" />
						</svg>
						<input
							type="text"
							placeholder="Search people..."
							value={searchQuery}
							onChange={e => handleSearch(e.target.value)}
							onFocus={() => searchQuery && setShowSearchDrop(true)}
							onBlur={() => setTimeout(() => setShowSearchDrop(false), 200)}
						/>
						{showSearchDrop && (
							<div className="search-dropdown">
								{searchLoading ? (
									<div className="search-loading">Searching...</div>
								) : searchResults.length === 0 ? (
									<div className="search-empty">No users found</div>
								) : (
									searchResults.map(u => (
										<div key={u.id} className="search-item" onMouseDown={() => { navigate(`/profile/${u.id}`); setSearchQuery(''); setShowSearchDrop(false) }}>
											<div className="search-avatar">
												{u.avatar ? <img src={u.avatar} alt="" /> : <span>{u.first_name[0]}{u.last_name[0]}</span>}
											</div>
											<div className="search-info">
												<strong>{u.first_name} {u.last_name}</strong>
												<span>{u.email}</span>
											</div>
										</div>
									))
								)}
							</div>
						)}
					</div>
				</div>

				<nav className="topbar-nav">
					{/* home */}
					<a
						href="/"
						className="nav-icon active"
						title="Home"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 18 21"
							fill="none"
						>
							<path
								stroke="currentColor"
								strokeWidth="1.5"
								d="M1 9.924c0-1.552 0-2.328.314-3.01.313-.682.902-1.187 2.08-2.196l1.143-.98C6.667 1.913 7.732 1 9 1c1.268 0 2.333.913 4.463 2.738l1.142.98c1.179 1.01 1.768 1.514 2.081 2.196.314.682.314 1.458.314 3.01v4.846c0 2.155 0 3.233-.67 3.902-.669.67-1.746.67-3.901.67H5.57c-2.155 0-3.232 0-3.902-.67C1 18.002 1 16.925 1 14.77V9.924z"
							/>
							<path
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								d="M11.857 19.341v-5.857a1 1 0 00-1-1H7.143a1 1 0 00-1 1v5.857"
							/>
						</svg>
					</a>

					{/* friends frind */}
					<a
						href="find-friends"
						className="nav-icon"
						title="Friends"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 26 20"
							fill="none"
						>
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M12.79 12.15h.429c2.268.015 7.45.243 7.45 3.732 0 3.466-5.002 3.692-7.415 3.707h-.894c-2.268-.015-7.452-.243-7.452-3.727 0-3.47 5.184-3.697 7.452-3.711l.297-.001h.132zm0 1.75c-2.792 0-6.12.34-6.12 1.962 0 1.585 3.13 1.955 5.864 1.976l.255.002c2.792 0 6.118-.34 6.118-1.958 0-1.638-3.326-1.982-6.118-1.982zM12.789 0c2.96 0 5.368 2.392 5.368 5.33 0 2.94-2.407 5.331-5.368 5.331h-.031a5.329 5.329 0 01-3.782-1.57 5.253 5.253 0 01-1.553-3.764C7.423 2.392 9.83 0 12.789 0zm0 1.75c-1.987 0-3.604 1.607-3.604 3.58a3.526 3.526 0 001.04 2.527 3.58 3.58 0 002.535 1.054l.03.875v-.875c1.987 0 3.605-1.605 3.605-3.58S14.777 1.75 12.789 1.75z"
								clipRule="evenodd"
							/>
						</svg>
					</a>

					{/* Notification Icon */}
					<div
						className="nav-icon-wrap"
						ref={notifRef}
					>
						<button
							className="nav-icon nav-icon-badge"
							title="Notifications"
							onClick={() => setNotifOpen(!notifOpen)}
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 20 22"
								fill="none"
							>
								<path
									fill="currentColor"
									fillRule="evenodd"
									d="M7.547 19.55c.533.59 1.218.915 1.93.915.714 0 1.403-.324 1.938-.916a.777.777 0 011.09-.056c.318.284.344.77.058 1.084-.832.917-1.927 1.423-3.086 1.423h-.002c-1.155-.001-2.248-.506-3.077-1.424a.762.762 0 01.057-1.083.774.774 0 011.092.057zM9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0zm0 1.535c-3.6 0-6.11 2.802-6.11 5.316 0 2.127-.595 3.11-1.12 3.978-.422.697-.755 1.247-.755 2.444.173 1.93 1.455 2.944 7.986 2.944 6.494 0 7.817-1.06 7.988-3.01-.003-1.13-.336-1.681-.757-2.378-.526-.868-1.12-1.851-1.12-3.978 0-2.514-2.51-5.316-6.111-5.316z"
									clipRule="evenodd"
								/>
							</svg>
							{unreadCount > 0 && (
								<span className="nav-badge">{unreadCount}</span>
							)}
						</button>

						{notifOpen && (
							<div className="notif-panel">
								<div className="notif-header">
									<h4>Notifications</h4>
									{unreadCount > 0 && (
										<button
											className="notif-mark-all"
											onClick={handleMarkAllRead}
										>
											Mark all as read
										</button>
									)}
								</div>
								<div className="notif-tabs">
									<button
										className={activeTab === 'all' ? 'active' : ''}
										onClick={() => setActiveTab('all')}
									>
										All
									</button>
									<button
										className={activeTab === 'unread' ? 'active' : ''}
										onClick={() => setActiveTab('unread')}
									>
										Unread {unreadCount > 0 && <span>{unreadCount}</span>}
									</button>
								</div>
								<div className="notif-list">
									{filtered.length === 0 ? (
										<div className="notif-empty">No notifications yet</div>
									) : (
										filtered.map((n) => (
											<div
												key={n.id}
												className={`notif-item ${!n.is_read ? 'unread' : ''}`}
												onClick={async () => {
													if (!n.is_read) {
														await api.post(
															`/notifications/read/${n.id}/`,
														)
														setNotifications((prev) =>
															prev.map((x) =>
																x.id === n.id
																	? { ...x, is_read: true }
																	: x,
															),
														)
														setUnreadCount((prev) =>
															Math.max(0, prev - 1),
														)
													}
													const postTypes = [
														'like_post',
														'comment',
														'reply',
														'like_comment',
														'like_reply',
													]
													if (
														postTypes.includes(n.type) &&
														n.post_id
													) {
														navigate(
															`/profile/${n.post_author_id}?post=${n.post_id}`,
														)
													} else {
														navigate(`/profile/${n.sender.id}`)
													}
													setNotifOpen(false)
												}}
											>
												<div className="notif-img-wrap">
													{n.sender.avatar ? (
														<img
															src={n.sender.avatar}
															alt=""
															className="notif-img"
														/>
													) : (
														<div className="notif-avatar-initials">
															{n.sender.initials}
														</div>
													)}
													{!n.is_read && (
														<span className="notif-dot" />
													)}
												</div>
												<div className="notif-body">
													<p>
														<strong>{n.sender.name}</strong>{' '}
														{NOTIF_TEXT[n.type]}
													</p>
													<span>{timeAgo(n.created_at)}</span>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						)}
					</div>

					{/* Message Icon */}
					<a
						href="#"
						className="nav-icon nav-icon-badge"
						title="Messages"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 23 22"
							fill="none"
						>
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M11.43 0c2.96 0 5.743 1.143 7.833 3.22 4.32 4.29 4.32 11.271 0 15.562C17.145 20.886 14.293 22 11.405 22c-1.575 0-3.16-.33-4.643-1.012-.437-.174-.847-.338-1.14-.338-.338.002-.793.158-1.232.308-.9.307-2.022.69-2.852-.131-.826-.822-.445-1.932-.138-2.826.152-.44.307-.895.307-1.239 0-.282-.137-.642-.347-1.161C-.57 11.46.322 6.47 3.596 3.22A11.04 11.04 0 0111.43 0zm0 1.535A9.5 9.5 0 004.69 4.307a9.463 9.463 0 00-1.91 10.686c.241.592.474 1.17.474 1.77 0 .598-.207 1.201-.39 1.733-.15.439-.378 1.1-.231 1.245.143.147.813-.085 1.255-.235.53-.18 1.133-.387 1.73-.391.597 0 1.161.225 1.758.463 3.655 1.679 7.98.915 10.796-1.881 3.716-3.693 3.716-9.7 0-13.391a9.5 9.5 0 00-6.74-2.77zm4.068 8.867c.57 0 1.03.458 1.03 1.024 0 .566-.46 1.023-1.03 1.023a1.023 1.023 0 11-.01-2.047h.01zm-4.131 0c.568 0 1.03.458 1.03 1.024 0 .566-.462 1.023-1.03 1.023a1.03 1.03 0 01-1.035-1.024c0-.566.455-1.023 1.025-1.023h.01zm-4.132 0c.568 0 1.03.458 1.03 1.024 0 .566-.462 1.023-1.03 1.023a1.022 1.022 0 11-.01-2.047h.01z"
								clipRule="evenodd"
							/>
						</svg>
					</a>
				</nav>

				{/* profile */}
				<div className="topbar-right">
					<div
						className="user-menu"
						ref={profileRef}
						onClick={() => setProfileOpen(!profileOpen)}
					>
						<div className="user-avatar">
							{user?.avatar ? (
								<img
									src={user.avatar}
									alt=""
								/>
							) : (
								initials
							)}
						</div>
						<span className="user-name">{user?.first_name}</span>
						<svg
							width="10"
							height="6"
							viewBox="0 0 10 6"
							fill="none"
						>
							<path
								fill="#555"
								d="M5 5l.354.354L5 5.707l-.354-.353L5 5zm4.354-3.646l-4 4-.708-.708 4-4 .708.708zm-4.708 4l-4-4 .708-.708 4 4-.708.708z"
							/>
						</svg>
						{profileOpen && (
							<div className="user-dropdown">
								<div className="dropdown-header">
									<div className="user-avatar lg">
										{user?.avatar ? (
											<img
												src={user.avatar}
												alt=""
											/>
										) : (
											initials
										)}
									</div>
									<div>
										<strong>
											{user?.first_name} {user?.last_name}
										</strong>
										<span>{user?.email}</span>
									</div>
								</div>
								<hr />
								<button
									className="dropdown-item"
									onClick={() => {
										setProfileOpen(false)
										navigate(`/profile/${user?.id}`)
									}}
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#1890ff"
										strokeWidth="2"
									>
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
										<circle
											cx="12"
											cy="7"
											r="4"
										/>
									</svg>
									View Profile
								</button>
								<button
									className="dropdown-item"
									onClick={() => {
										setProfileOpen(false)
										navigate('/settings')
									}}
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#555"
										strokeWidth="2"
									>
										<circle
											cx="12"
											cy="12"
											r="3"
										/>
										<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
									</svg>
									Settings
								</button>
								<button
									className="dropdown-item"
									onClick={() => {
										setProfileOpen(false)
										navigate('/help')
									}}
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#555"
										strokeWidth="2"
									>
										<circle
											cx="12"
											cy="12"
											r="10"
										/>
										<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
										<line
											x1="12"
											y1="17"
											x2="12.01"
											y2="17"
										/>
									</svg>
									Help & Support
								</button>
								{user?.is_staff && (
									<button
										className="dropdown-item"
										onClick={() => {
											setProfileOpen(false)
											navigate('/admin')
										}}
									>
										<svg
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="#722ed1"
											strokeWidth="2"
										>
											<rect
												x="3"
												y="3"
												width="7"
												height="7"
												rx="1"
											/>
											<rect
												x="14"
												y="3"
												width="7"
												height="7"
												rx="1"
											/>
											<rect
												x="3"
												y="14"
												width="7"
												height="7"
												rx="1"
											/>
											<rect
												x="14"
												y="14"
												width="7"
												height="7"
												rx="1"
											/>
										</svg>
										Dashboard
									</button>
								)}
								<button
									onClick={logout}
									className="dropdown-item"
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 19 19"
										fill="none"
									>
										<path
											stroke="#1890FF"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="1.5"
											d="M6.667 18H2.889A1.889 1.889 0 011 16.111V2.89A1.889 1.889 0 012.889 1h3.778M13.277 14.222L18 9.5l-4.723-4.722M18 9.5H6.667"
										/>
									</svg>
									Log Out
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	)
}

export default Navbar
