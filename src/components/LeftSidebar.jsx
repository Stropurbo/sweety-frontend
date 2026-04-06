import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const LeftSidebar = ({ posts }) => {
	const { user } = useAuth()
	const navigate = useNavigate()
	const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : ''
	const myPosts = posts.filter(p => p.author.id === user?.id)
	const [events, setEvents] = useState([])
	const [interestedMap, setInterestedMap] = useState({})

	useEffect(() => {
		api.get('/posts/events/').then(r => {
			setEvents(r.data)
			const map = {}
			r.data.forEach(e => { map[e.id] = e.is_interested })
			setInterestedMap(map)
		}).catch(() => {})
	}, [])

	const toggleInterest = async (ev) => {
		if (ev.author.id === user?.id) return
		try {
			if (interestedMap[ev.id]) {
				const res = await api.delete(`/posts/${ev.id}/interest/`)
				setInterestedMap(prev => ({ ...prev, [ev.id]: false }))
				setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, interest_count: res.data.interest_count } : e))
			} else {
				const res = await api.post(`/posts/${ev.id}/interest/`)
				setInterestedMap(prev => ({ ...prev, [ev.id]: true }))
				setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, interest_count: res.data.interest_count } : e))
			}
		} catch {}
	}

	const explore = [
		{ icon: '🏠', label: 'Feed',         path: '/feed' },
		{ icon: '👤', label: 'My Profile',   path: `/profile/${user?.id}` },
		{ icon: '🔍', label: 'Find Friends', path: '/find-friends' },
		{ icon: '🔖', label: 'Saved Posts',  path: '/saved' },
		{ icon: '⚙️', label: 'Settings',     path: '/settings' },
	]

	const sidebarRef = useRef(null)

	return (
		<aside className="sidebar-left" ref={sidebarRef}>
			{/* Profile Card */}
			<div className="sidebar-card profile-card">
				<div className="profile-banner" />
				<div className="profile-body">
					<div className="profile-avatar-wrap">
						<div
							className="profile-avatar"
							style={{ cursor: 'pointer', overflow: 'hidden' }}
							onClick={() => navigate(`/profile/${user?.id}`)}
						>
							{user?.avatar
								? <img src={user.avatar} alt="avatar"
									style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
								: initials}
						</div>
					</div>
					<h3
						style={{ cursor: 'pointer' }}
						onClick={() => navigate(`/profile/${user?.id}`)}
					>
						{user?.first_name} {user?.last_name}
					</h3>
					<p>{user?.email}</p>
					<div className="profile-stats">
						<div className="pstat" style={{ cursor: 'pointer' }}
							onClick={() => navigate(`/profile/${user?.id}`)}>
							<strong>{myPosts.length}</strong>
							<span>Posts</span>
						</div>
						<div className="pstat">
							<strong>{myPosts.filter(p => p.visibility === 'public').length}</strong>
							<span>Public</span>
						</div>
						<div className="pstat">
							<strong>{myPosts.filter(p => p.visibility === 'private').length}</strong>
							<span>Private</span>
						</div>
					</div>
				</div>
			</div>

			{/* Explore */}
			<div className="sidebar-card">
				<h4 className="sidebar-title">Explore</h4>
				<ul className="explore-list">
					{explore.map(({ icon, label, path }) => (
						<li key={label} className="explore-item">
							<a href="#0" onClick={e => { e.preventDefault(); navigate(path) }}>
								{icon} {label}
							</a>
						</li>
					))}
				</ul>
			</div>

			{/* Events */}
			{events.length > 0 && (
				<div className="sidebar-card">
					<h4 className="sidebar-title">📅 Events</h4>
					<div className="sb-events-list">
						{events.map(ev => {
							const isOwn = ev.author.id === user?.id
							const interested = interestedMap[ev.id]
							const coverImg = ev.media?.[0]?.url || ev.image
							const dateStr = ev.event_date
								? new Date(ev.event_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
								: null
							return (
								<div key={ev.id} className="sb-event-card" onClick={() => navigate(`/events/${ev.id}`)}>
									<div
										className="sb-event-cover"
										style={{ backgroundImage: coverImg ? `url(${coverImg})` : undefined }}
									>
										<span className="sb-event-badge">EVENT</span>
										{isOwn && <span className="sb-event-own-badge">Your Event</span>}
									</div>
									<div className="sb-event-body">
										<div className="sb-event-title">{ev.event_title}</div>
										{dateStr && <div className="sb-event-date">🕐 {dateStr}</div>}
										{ev.event_location && <div className="sb-event-location">📍 {ev.event_location}</div>}
										<div className="sb-event-footer">
											{ev.interest_count > 0 && (
												<span className="sb-event-count">🙋 {ev.interest_count}</span>
											)}
											{!isOwn && (
												<button
													className={`sb-event-interest-btn ${interested ? 'active' : ''}`}
													onClick={e => { e.stopPropagation(); toggleInterest(ev) }}
												>
													{interested ? '✓ Interested' : 'Interested?'}
												</button>
											)}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</aside>
	)
}

export default LeftSidebar
