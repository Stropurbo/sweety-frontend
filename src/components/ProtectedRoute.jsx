import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
	const { user, loading } = useAuth()

	if (loading) return (
		<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999 }}>
			<div style={{
				height: '3px',
				background: 'linear-gradient(90deg, #1890ff, #722ed1)',
				animation: 'pr-bar 1.2s ease-in-out infinite',
			}} />
			<style>{`
				@keyframes pr-bar {
					0%   { width: 0%; margin-left: 0; }
					50%  { width: 70%; margin-left: 15%; }
					100% { width: 0%; margin-left: 100%; }
				}
			`}</style>
		</div>
	)

	return user ? children : <Navigate to="/login" />
}

export default ProtectedRoute
