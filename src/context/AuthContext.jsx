import { createContext, useContext, useState, useEffect, startTransition } from 'react'
import api from '../api/axios'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)
export default AuthContext

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchUser = async () => {
			const token = localStorage.getItem('access')
			if (!token) {
				startTransition(() => setLoading(false))
				return
			}
			try {
				const res = await api.get('/auth/me/')
				startTransition(() => {
					setUser(res.data)
					setLoading(false)
				})
			} catch {
				localStorage.clear()
				startTransition(() => setLoading(false))
			}
		}
		fetchUser()
	}, [])

	const login = (data) => {
		localStorage.setItem('access', data.access)
		localStorage.setItem('refresh', data.refresh)
		setUser(data.user)
	}

	const logout = async () => {
		const refresh = localStorage.getItem('refresh')
		if (refresh) {
			try { await api.post('/auth/logout/', { refresh }) } catch {}
		}
		localStorage.clear()
		setUser(null)
	}

	return (
		<AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	)
}
