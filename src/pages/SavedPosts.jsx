import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import '../styles/feed.css'

const SavedPosts = () => {
	const { user } = useAuth()
	const navigate = useNavigate()
	const [posts, setPosts] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		api.get('/posts/saved/')
			.then(res => { setPosts(res.data.results || res.data); setLoading(false) })
			.catch(() => setLoading(false))
	}, [])

	const handlePostDeleted = (id) => setPosts(prev => prev.filter(p => p.id !== id))

	return (
		<div className="app-wrap">
			<Navbar />
			<main className="feed-main">
				<div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
						<button
							onClick={() => navigate('/feed')}
							style={{
								width: 36, height: 36, borderRadius: '50%',
								background: '#fff', border: 'none', cursor: 'pointer',
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								boxShadow: '0 2px 8px rgba(0,0,0,0.08)', color: '#333',
							}}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
								<path d="M19 12H5M12 5l-7 7 7 7" />
							</svg>
						</button>
						<div>
							<h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#212121' }}>Saved Posts</h2>
							<p style={{ margin: 0, fontSize: '0.82rem', color: '#999' }}>{posts.length} saved</p>
						</div>
					</div>

					{loading ? (
						<div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Loading...</div>
					) : posts.length === 0 ? (
						<div className="empty-feed">
							<span>🔖</span>
							<h3>No saved posts yet</h3>
							<p>Posts you save will appear here</p>
						</div>
					) : (
						<div className="feed-center">
							{posts.map(post => (
								<PostCard
									key={post.id}
									post={post}
									onDelete={handlePostDeleted}
									currentUser={user}
								/>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	)
}

export default SavedPosts
