import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import '../styles/friends-list.css'

const FriendsList = () => {
	const { id } = useParams()
	const { user: currentUser } = useAuth()
	const navigate = useNavigate()
	const [friends, setFriends] = useState([])
	const [profileUser, setProfileUser] = useState(null)
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [unfriending, setUnfriending] = useState({})

	const isOwn = currentUser?.id === parseInt(id)

	useEffect(() => {
		Promise.all([
			api.get(`/friends/list/${id}/`),
			api.get(`/auth/profile/${id}/`),
		]).then(([fr, pr]) => {
			setFriends(fr.data)
			setProfileUser(pr.data.user)
			setLoading(false)
		}).catch(() => navigate('/feed'))
	}, [id])

	const handleUnfriend = async (friendId) => {
		if (!window.confirm('Remove this friend?')) return
		setUnfriending(prev => ({ ...prev, [friendId]: true }))
		try {
			await api.post(`/friends/respond/${friendId}/`, { action: 'reject' })
			setFriends(prev => prev.filter(f => f.id !== friendId))
		} catch {}
		setUnfriending(prev => ({ ...prev, [friendId]: false }))
	}

	const filtered = friends.filter(f =>
		`${f.first_name} ${f.last_name}`.toLowerCase().includes(search.toLowerCase())
	)

	const online = filtered.filter(f => f.is_online)
	const offline = filtered.filter(f => !f.is_online)

	if (loading) return (
		<div className="fl-wrap">
			<Navbar />
			<div className="fl-loading">
				<div className="fl-spinner" />
			</div>
		</div>
	)

	return (
		<div className="fl-wrap">
			<Navbar />
			<main className="fl-main">
				{/* Header */}
				<div className="fl-header">
					<div className="fl-header-left">
						<button className="fl-back-btn" onClick={() => navigate(`/profile/${id}`)}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
								<path d="M19 12H5M12 5l-7 7 7 7" />
							</svg>
						</button>
						<div>
							<h2>{isOwn ? 'Your Friends' : `${profileUser?.first_name}'s Friends`}</h2>
							<p>{friends.length} {friends.length === 1 ? 'friend' : 'friends'} · {online.length} active now</p>
						</div>
					</div>
					<div className="fl-search-wrap">
						<svg width="15" height="15" viewBox="0 0 17 17" fill="none">
							<circle cx="7" cy="7" r="6" stroke="#999" />
							<path stroke="#999" strokeLinecap="round" d="M16 16l-3-3" />
						</svg>
						<input
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="Search friends..."
						/>
					</div>
				</div>

				{filtered.length === 0 ? (
					<div className="fl-empty">
						<span>{search ? '🔍' : '👥'}</span>
						<h3>{search ? 'No results found' : 'No friends yet'}</h3>
						<p>{search ? `No friends match "${search}"` : 'Add friends to see them here'}</p>
					</div>
				) : (
					<>
						{/* Active Now */}
						{online.length > 0 && (
							<div className="fl-section">
								<h3 className="fl-section-title">
									<span className="fl-online-dot" /> Active Now · {online.length}
								</h3>
								<div className="fl-grid">
									{online.map(f => (
										<FriendCard
											key={f.id}
											friend={f}
											isOwn={isOwn}
											currentUser={currentUser}
											onUnfriend={handleUnfriend}
											unfriending={unfriending[f.id]}
											navigate={navigate}
										/>
									))}
								</div>
							</div>
						)}

						{/* All / Offline */}
						{offline.length > 0 && (
							<div className="fl-section">
								{online.length > 0 && (
									<h3 className="fl-section-title">All Friends · {offline.length}</h3>
								)}
								<div className="fl-grid">
									{offline.map(f => (
										<FriendCard
											key={f.id}
											friend={f}
											isOwn={isOwn}
											currentUser={currentUser}
											onUnfriend={handleUnfriend}
											unfriending={unfriending[f.id]}
											navigate={navigate}
										/>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</main>
		</div>
	)
}

const FriendCard = ({ friend, isOwn, currentUser, onUnfriend, unfriending, navigate }) => {
	const [friendStatus, setFriendStatus] = useState(isOwn ? 'friends' : null)
	const [actionLoading, setActionLoading] = useState(false)
	const initials = `${friend.first_name[0]}${friend.last_name[0]}`.toUpperCase()

	useEffect(() => {
		if (isOwn || !currentUser || currentUser.id === friend.id) return
		api.get(`/friends/status/${friend.id}/`)
			.then(r => setFriendStatus(r.data.status))
			.catch(() => {})
	}, [friend.id])

	const handleFriendAction = async () => {
		if (actionLoading) return
		setActionLoading(true)
		try {
			if (friendStatus === 'none') {
				const r = await api.post(`/friends/request/${friend.id}/`)
				setFriendStatus(r.data.status === 'accepted' ? 'friends' : 'pending_sent')
			} else if (friendStatus === 'pending_received') {
				await api.post(`/friends/respond/${friend.id}/`, { action: 'accept' })
				setFriendStatus('friends')
			}
		} finally { setActionLoading(false) }
	}

	return (
		<div className="fl-card">
			<div className="fl-card-avatar-wrap" onClick={() => navigate(`/profile/${friend.id}`)}>
				<div className="fl-card-avatar">
					{friend.avatar
						? <img src={friend.avatar} alt="" />
						: <span>{initials}</span>}
				</div>
				<span className={`fl-online-indicator ${friend.is_online ? 'on' : 'off'}`} />
			</div>

			<div className="fl-card-info" onClick={() => navigate(`/profile/${friend.id}`)}>
				<strong>{friend.first_name} {friend.last_name}</strong>
				<span>{friend.is_online ? 'Active now' : friend.bio ? friend.bio.slice(0, 30) + (friend.bio.length > 30 ? '…' : '') : 'Member'}</span>
			</div>

			<div className="fl-card-actions">
				{/* View Profile */}
				<button className="fl-btn fl-btn-profile" onClick={() => navigate(`/profile/${friend.id}`)}>
					View Profile
				</button>

				{/* Friend action — only show if not own list and not the current user */}
				{!isOwn && currentUser?.id !== friend.id && (
					<>
						{friendStatus === 'none' && (
							<button className="fl-btn fl-btn-add" onClick={handleFriendAction} disabled={actionLoading}>
								+ Add Friend
							</button>
						)}
						{friendStatus === 'pending_sent' && (
							<button className="fl-btn fl-btn-pending" disabled>⏳ Pending</button>
						)}
						{friendStatus === 'pending_received' && (
							<button className="fl-btn fl-btn-accept" onClick={handleFriendAction} disabled={actionLoading}>
								✓ Accept
							</button>
						)}
						{friendStatus === 'friends' && (
							<button className="fl-btn fl-btn-friends" disabled>✓ Friends</button>
						)}
					</>
				)}

				{/* Unfriend — only own list */}
				{isOwn && (
					<button
						className="fl-btn fl-btn-unfriend"
						onClick={() => onUnfriend(friend.id)}
						disabled={unfriending}
					>
						{unfriending ? '...' : 'Unfriend'}
					</button>
				)}
			</div>
		</div>
	)
}

export default FriendsList
