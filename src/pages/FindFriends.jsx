import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import '../styles/find-friends.css'

const FindFriends = () => {
	const navigate = useNavigate()
	const [users, setUsers] = useState([])
	const [loading, setLoading] = useState(true)
	const [requests, setRequests] = useState({}) // { [id]: 'pending_sent' | 'friends' }

	useEffect(() => {
		api.get('/auth/suggested/?limit=50')
			.then(res => { setUsers(res.data); setLoading(false) })
			.catch(() => setLoading(false))
	}, [])

	const handleAdd = async (id) => {
		setRequests(prev => ({ ...prev, [id]: 'loading' }))
		try {
			const res = await api.post(`/friends/request/${id}/`)
			setRequests(prev => ({ ...prev, [id]: res.data.status === 'accepted' ? 'friends' : 'pending_sent' }))
		} catch {
			setRequests(prev => { const n = { ...prev }; delete n[id]; return n })
		}
	}

	return (
		<div className="ff-wrap">
			<Navbar />
			<main className="ff-main">
				<div className="ff-header">
					<h2>Find Friends</h2>
					<p>People you may know</p>
				</div>

				{loading ? (
					<div className="ff-grid">
						{Array(8).fill(0).map((_, i) => (
							<div key={i} className="ff-card ff-skeleton">
								<div className="ff-sk-avatar" />
								<div className="ff-sk-line w60" />
								<div className="ff-sk-line w40" />
								<div className="ff-sk-btn" />
							</div>
						))}
					</div>
				) : users.length === 0 ? (
					<div className="ff-empty">
						<span>🎉</span>
						<h3>You know everyone!</h3>
						<p>No new people to suggest right now.</p>
					</div>
				) : (
					<div className="ff-grid">
						{users.map(u => {
							const initials = `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
							const status = requests[u.id]
							return (
								<div key={u.id} className="ff-card">
									<div className="ff-avatar" onClick={() => navigate(`/profile/${u.id}`)}>
										{u.avatar
											? <img src={u.avatar} alt="" />
											: <span>{initials}</span>}
									</div>
									<strong className="ff-name" onClick={() => navigate(`/profile/${u.id}`)}>
										{u.first_name} {u.last_name}
									</strong>
									<span className="ff-bio">
										{u.bio ? u.bio.slice(0, 40) + (u.bio.length > 40 ? '…' : '') : 'Member'}
									</span>
									<div className="ff-actions">
										{!status && (
											<button className="ff-btn ff-btn-add" onClick={() => handleAdd(u.id)}>
												+ Add Friend
											</button>
										)}
										{status === 'loading' && (
											<button className="ff-btn ff-btn-pending" disabled>...</button>
										)}
										{status === 'pending_sent' && (
											<button className="ff-btn ff-btn-pending" disabled>⏳ Pending</button>
										)}
										{status === 'friends' && (
											<button className="ff-btn ff-btn-friends" disabled>✓ Friends</button>
										)}
										<button className="ff-btn ff-btn-view" onClick={() => navigate(`/profile/${u.id}`)}>
											View Profile
										</button>
									</div>
								</div>
							)
						})}
					</div>
				)}
			</main>
		</div>
	)
}

export default FindFriends
