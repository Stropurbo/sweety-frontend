import { useState, useEffect, startTransition, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import LeftSidebar from '../components/LeftSidebar'
import RightSidebar from '../components/RightSidebar'
import CreatePost from '../components/CreatePost'
import PostCard from '../components/PostCard'
import FeedSkeleton from '../components/FeedSkeleton'
import StoryBar from '../components/StoryBar'
import useAuth from '../context/useAuth'
import usePolling from '../hooks/usePolling'
import '../styles/feed.css'

const Feed = () => {
	const { user } = useAuth()
	const [posts, setPosts] = useState([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [nextCursor, setNextCursor] = useState(null)
	const [highlightId, setHighlightId] = useState(null)
	const [searchParams] = useSearchParams()
	const postRefs = useRef({})
	const observerRef = useRef(null)
	const sentinelRef = useRef(null)

	const fetchPosts = useCallback(async (cursor = null) => {
		try {
			const params = cursor ? { cursor } : {}
			const res = await api.get('/posts/', { params })
			const { results, next } = res.data
			const cursorParam = next ? new URL(next).searchParams.get('cursor') : null
			startTransition(() => {
				setPosts(prev => cursor ? [...prev, ...results] : results)
				setNextCursor(cursorParam)
			})
		} finally {
			startTransition(() => { setLoading(false); setLoadingMore(false) })
		}
	}, [])

	useEffect(() => { fetchPosts() }, [fetchPosts])

	// Poll for new posts every 15s — prepend only truly new ones
	const pollNewPosts = useCallback(async () => {
		try {
			const res = await api.get('/posts/')
			const { results } = res.data
			if (!results?.length) return
			setPosts(prev => {
				const existingIds = new Set(prev.map(p => p.id))
				const newOnes = results.filter(p => !existingIds.has(p.id))
				return newOnes.length ? [...newOnes, ...prev] : prev
			})
		} catch { /* ignore */ }
	}, [])
	usePolling(pollNewPosts, 3000)

	// Infinite scroll via IntersectionObserver
	useEffect(() => {
		if (!sentinelRef.current) return
		observerRef.current = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting && nextCursor && !loadingMore) {
				setLoadingMore(true)
				fetchPosts(nextCursor)
			}
		}, { threshold: 0.1 })
		observerRef.current.observe(sentinelRef.current)
		return () => observerRef.current?.disconnect()
	}, [nextCursor, loadingMore, fetchPosts])

	useEffect(() => {
		const postId = searchParams.get('post')
		if (!postId || loading) return
		const id = parseInt(postId)
		setHighlightId(id)
		setTimeout(() => {
			postRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
		}, 100)
		setTimeout(() => setHighlightId(null), 3000)
	}, [searchParams, loading])

	const handlePostCreated = (p) => setPosts((prev) => [p, ...prev])
	const handlePostDeleted = (id) => setPosts((prev) => prev.filter((p) => p.id !== id))

	const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : ''

	return (
		<div className="app-wrap">
			<Navbar />
			<main className="feed-main">
				<div className="feed-grid">
					<LeftSidebar posts={posts} />

					<section className="feed-center">
						<StoryBar />
						<CreatePost
							onPostCreated={handlePostCreated}
							userInitials={initials}
						/>
						{loading ? (
							<FeedSkeleton />
						) : posts.length === 0 ? (
							<div className="empty-feed">
								<span>📝</span>
								<h3>No posts yet</h3>
								<p>Be the first to share something!</p>
							</div>
						) : (
							<>
								{posts.map((post) => (
									<div key={post.id} ref={(el) => (postRefs.current[post.id] = el)}>
										<PostCard
											post={post}
											onDelete={handlePostDeleted}
											currentUser={user}
											highlighted={highlightId === post.id}
										/>
									</div>
								))}
								<div ref={sentinelRef} style={{ height: 1 }} />
								{loadingMore && <FeedSkeleton />}
							</>
						)}
					</section>

					<RightSidebar />
				</div>
			</main>
		</div>
	)
}

export default Feed
