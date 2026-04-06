import { Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import HelpSupport from './pages/HelpSupport'
import FindFriends from './pages/FindFriends'
import FriendsList from './pages/FriendsList'
import SavedPosts from './pages/SavedPosts'
import EventDetail from './pages/EventDetail'

export const PATHS = {
	home: '/',
	login: '/login',
	register: '/register',
	feed: '/feed',
	admin: '/admin',
	profile: '/profile/:id',
	settings: '/settings',
	help: '/help',
	findFriends: '/find-friends',
	friendsList: '/friends/:id',
	savedPosts: '/saved',
	eventDetail: '/events/:id',
}

const routes = [
	{ path: PATHS.home, element: <Navigate to={PATHS.feed} /> },
	{ path: PATHS.login, element: <Login /> },
	{ path: PATHS.register, element: <Register /> },
	{
		path: PATHS.feed,
		element: (<ProtectedRoute><Feed /></ProtectedRoute>),
	},
	{
		path: PATHS.admin,
		element: (<ProtectedRoute><AdminDashboard /></ProtectedRoute>),
	},
	{
		path: PATHS.profile,
		element: (<ProtectedRoute><Profile /></ProtectedRoute>),
	},
	{
		path: PATHS.settings,
		element: (<ProtectedRoute><Settings /></ProtectedRoute>),
	},
	{
		path: PATHS.help,
		element: (<ProtectedRoute><HelpSupport /></ProtectedRoute>),
	},
	{
		path: PATHS.findFriends,
		element: (<ProtectedRoute><FindFriends /></ProtectedRoute>),
	},
	{
		path: PATHS.friendsList,
		element: (<ProtectedRoute><FriendsList /></ProtectedRoute>),
	},
	{
		path: PATHS.savedPosts,
		element: (<ProtectedRoute><SavedPosts /></ProtectedRoute>),
	},
	{
		path: PATHS.eventDetail,
		element: (<ProtectedRoute><EventDetail /></ProtectedRoute>),
	},
	{ path: '*', element: <Navigate to={PATHS.login} /> },
]

export default routes
