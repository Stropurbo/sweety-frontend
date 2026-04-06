import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import '../styles/settings.css'

const Settings = () => {
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [activeSection, setActiveSection] = useState('password')

	// Password state
	const [currentPass, setCurrentPass] = useState('')
	const [newPass, setNewPass] = useState('')
	const [confirmPass, setConfirmPass] = useState('')
	const [showCurrent, setShowCurrent] = useState(false)
	const [showNew, setShowNew] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [passLoading, setPassLoading] = useState(false)
	const [passMsg, setPassMsg] = useState(null)

	const handleChangePassword = async () => {
		setPassMsg(null)
		if (!currentPass || !newPass || !confirmPass)
			return setPassMsg({ type: 'error', text: 'All fields are required' })
		if (newPass.length < 8)
			return setPassMsg({ type: 'error', text: 'New password must be at least 8 characters' })
		if (newPass !== confirmPass)
			return setPassMsg({ type: 'error', text: 'Passwords do not match' })
		setPassLoading(true)
		try {
			await api.post('/auth/change-password/', {
				current_password: currentPass,
				new_password: newPass,
			})
			setCurrentPass(''); setNewPass(''); setConfirmPass('')
			setPassMsg({ type: 'success', text: 'Password changed successfully!' })
		} catch (err) {
			setPassMsg({ type: 'error', text: err?.response?.data?.error || 'Current password is incorrect' })
		} finally { setPassLoading(false) }
	}

	const passStrength = newPass.length === 0 ? null
		: newPass.length < 6 ? 'weak'
		: newPass.length < 10 ? 'medium' : 'strong'

	const SECTIONS = [
		{ key: 'password', icon: '🔒', label: 'Password & Security' },
		{ key: 'account',  icon: '👤', label: 'Account Info' },
		{ key: 'privacy',  icon: '🛡️', label: 'Privacy' },
		{ key: 'danger',   icon: '⚠️', label: 'Danger Zone' },
	]

	return (
		<div className="settings-wrap">
			<Navbar />
			<div className="settings-layout">
				{/* Sidebar */}
				<aside className="settings-sidebar">
					<h2 className="settings-title">Settings</h2>
					<nav className="settings-nav">
						{SECTIONS.map(s => (
							<button key={s.key}
								className={`settings-nav-item ${activeSection === s.key ? 'active' : ''} ${s.key === 'danger' ? 'danger' : ''}`}
								onClick={() => setActiveSection(s.key)}>
								<span>{s.icon}</span>
								{s.label}
							</button>
						))}
					</nav>
				</aside>

				{/* Content */}
				<main className="settings-main">

					{/* Password & Security */}
					{activeSection === 'password' && (
						<div className="settings-card">
							<div className="settings-card-header">
								<h3>🔒 Password & Security</h3>
								<p>Keep your account secure by using a strong password.</p>
							</div>

							{passMsg && (
								<div className={`settings-msg ${passMsg.type}`}>{passMsg.text}</div>
							)}

							<div className="settings-field">
								<label>Current Password</label>
								<div className="settings-pass-wrap">
									<input type={showCurrent ? 'text' : 'password'}
										value={currentPass} onChange={e => setCurrentPass(e.target.value)}
										placeholder="Enter current password" />
									<button className="settings-eye" onClick={() => setShowCurrent(v => !v)}>
										{showCurrent ? '🙈' : '👁️'}
									</button>
								</div>
							</div>

							<div className="settings-field">
								<label>New Password</label>
								<div className="settings-pass-wrap">
									<input type={showNew ? 'text' : 'password'}
										value={newPass} onChange={e => setNewPass(e.target.value)}
										placeholder="Minimum 8 characters" />
									<button className="settings-eye" onClick={() => setShowNew(v => !v)}>
										{showNew ? '🙈' : '👁️'}
									</button>
								</div>
								{passStrength && (
									<div className="settings-strength">
										<div className={`settings-strength-bar ${passStrength}`} />
										<span className={`settings-strength-label ${passStrength}`}>
											{passStrength === 'weak' ? 'Weak' : passStrength === 'medium' ? 'Medium' : 'Strong'}
										</span>
									</div>
								)}
							</div>

							<div className="settings-field">
								<label>Confirm New Password</label>
								<div className="settings-pass-wrap">
									<input type={showConfirm ? 'text' : 'password'}
										value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
										placeholder="Re-enter new password" />
									<button className="settings-eye" onClick={() => setShowConfirm(v => !v)}>
										{showConfirm ? '🙈' : '👁️'}
									</button>
								</div>
								{confirmPass.length > 0 && (
									<span className={`settings-match ${newPass === confirmPass ? 'ok' : 'no'}`}>
										{newPass === confirmPass ? '✓ Passwords match' : '✕ Passwords do not match'}
									</span>
								)}
							</div>

							<button className="settings-save-btn" onClick={handleChangePassword} disabled={passLoading}>
								{passLoading ? 'Changing...' : 'Change Password'}
							</button>
						</div>
					)}

					{/* Account Info */}
					{activeSection === 'account' && (
						<div className="settings-card">
							<div className="settings-card-header">
								<h3>👤 Account Info</h3>
								<p>Your account details and membership information.</p>
							</div>
							<div className="settings-info-grid">
								<div className="settings-info-item">
									<span className="settings-info-label">Full Name</span>
									<span className="settings-info-value">{user?.first_name} {user?.last_name}</span>
								</div>
								<div className="settings-info-item">
									<span className="settings-info-label">Email Address</span>
									<span className="settings-info-value">{user?.email}</span>
								</div>
								<div className="settings-info-item">
									<span className="settings-info-label">Account Role</span>
									<span className={`settings-role-badge ${user?.is_staff ? 'admin' : 'user'}`}>
										{user?.is_staff ? '⚙️ Admin' : '👤 User'}
									</span>
								</div>
								<div className="settings-info-item">
									<span className="settings-info-label">Profile</span>
									<button className="settings-link-btn"
										onClick={() => navigate(`/profile/${user?.id}`)}>
										View Profile →
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Privacy */}
					{activeSection === 'privacy' && (
						<div className="settings-card">
							<div className="settings-card-header">
								<h3>🛡️ Privacy</h3>
								<p>Control who can see your content.</p>
							</div>
							<div className="settings-privacy-list">
								{[
									{ label: 'Default post visibility', desc: 'New posts will be public by default. You can change each post individually.' },
									{ label: 'Profile visibility', desc: 'Your profile is visible to all logged-in users.' },
									{ label: 'Post history', desc: 'Manage your posts from your profile page.' },
								].map(item => (
									<div key={item.label} className="settings-privacy-item">
										<div>
											<strong>{item.label}</strong>
											<p>{item.desc}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Danger Zone */}
					{activeSection === 'danger' && (
						<div className="settings-card settings-danger-card">
							<div className="settings-card-header">
								<h3>⚠️ Danger Zone</h3>
								<p>These actions are irreversible. Please proceed with caution.</p>
							</div>
							<div className="settings-danger-item">
								<div>
									<strong>Log Out</strong>
									<p>Sign out from your current session.</p>
								</div>
								<button className="settings-danger-btn outline" onClick={logout}>
									Log Out
								</button>
							</div>
							<div className="settings-danger-item">
								<div>
									<strong>Delete Account</strong>
									<p>Permanently delete your account and all your posts. This cannot be undone.</p>
								</div>
								<button className="settings-danger-btn"
									onClick={() => window.confirm('Are you sure? This will permanently delete your account.') && logout()}>
									Delete Account
								</button>
							</div>
						</div>
					)}

				</main>
			</div>
		</div>
	)
}

export default Settings
