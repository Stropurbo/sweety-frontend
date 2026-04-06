import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

const Field = ({
	label,
	name,
	type = 'text',
	placeholder,
	value,
	onChange,
	error,
	showToggle,
	showState,
	onToggle,
}) => (
	<div className={`auth-field ${error ? 'has-error' : value ? 'has-success' : ''}`}>
		<label>{label}</label>
		<div className={showToggle ? 'input-eye' : ''}>
			<input
				type={showToggle ? (showState ? 'text' : 'password') : type}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
			/>
			{showToggle && (
				<button
					type="button"
					onClick={onToggle}
				>
					{showState ? '🙈' : '👁️'}
				</button>
			)}
		</div>
		{error && <span className="field-error">{error}</span>}
	</div>
)

const Register = () => {
	const { login } = useAuth()
	const navigate = useNavigate()
	const [form, setForm] = useState({
		first_name: '',
		last_name: '',
		email: '',
		password: '',
		confirm_password: '',
	})
	const [errors, setErrors] = useState({})
	const [loading, setLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	const validate = (name, value) => {
		switch (name) {
			case 'first_name':
			case 'last_name':
				return value.trim() ? '' : 'Required.'
			case 'email':
				return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email.'
			case 'password':
				return value.length >= 8 ? '' : 'Min 8 characters.'
			case 'confirm_password':
				return value === form.password ? '' : 'Passwords do not match.'
			default:
				return ''
		}
	}

	const handleChange = (e) => {
		const { name, value } = e.target
		setForm((prev) => ({ ...prev, [name]: value }))
		setErrors((prev) => ({ ...prev, [name]: validate(name, value) }))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		const newErrors = {}
		Object.keys(form).forEach((k) => {
			const err = validate(k, form[k])
			if (err) newErrors[k] = err
		})
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors)
			return
		}
		setLoading(true)
		try {
			const { confirm_password, ...data } = form
			const res = await api.post('/auth/register/', data)
			login(res.data)
			navigate('/feed')
		} catch (err) {
			const serverErrors = err.response?.data
			if (serverErrors) {
				const mapped = {}
				Object.entries(serverErrors).forEach(([k, v]) => {
					mapped[k] = Array.isArray(v) ? v[0] : v
				})
				setErrors(mapped)
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="auth-page">
			<div className="auth-bg">
				<img
					src="/assets/images/registration.png"
					alt=""
				/>
				<div className="auth-overlay" />
			</div>

			<div className="auth-center">
				<div className="auth-form-box">
					<div className="auth-brand">
						<img
							src="/sweety-icon.svg"
							alt="Sweety"
						/>
						<span>Sweety</span>
					</div>
					<h2>Create Account</h2>
					<p className="auth-sub">Fill in your details to get started</p>

					<form
						onSubmit={handleSubmit}
						noValidate
					>
						<div className="auth-row">
							<Field
								label="First Name"
								name="first_name"
								placeholder="John"
								value={form.first_name}
								onChange={handleChange}
								error={errors.first_name}
							/>
							<Field
								label="Last Name"
								name="last_name"
								placeholder="Doe"
								value={form.last_name}
								onChange={handleChange}
								error={errors.last_name}
							/>
						</div>
						<Field
							label="Email address"
							name="email"
							type="email"
							placeholder="you@example.com"
							value={form.email}
							onChange={handleChange}
							error={errors.email}
						/>
						<Field
							label="Password"
							name="password"
							placeholder="Min 8 characters"
							value={form.password}
							onChange={handleChange}
							error={errors.password}
							showToggle
							showState={showPassword}
							onToggle={() => setShowPassword(!showPassword)}
						/>
						<Field
							label="Confirm Password"
							name="confirm_password"
							placeholder="Re-enter password"
							value={form.confirm_password}
							onChange={handleChange}
							error={errors.confirm_password}
							showToggle
							showState={showConfirm}
							onToggle={() => setShowConfirm(!showConfirm)}
						/>
						<button
							type="submit"
							className="auth-submit"
							disabled={loading}
						>
							{loading ? 'Creating account...' : 'Create Account'}
						</button>
					</form>

					<p className="auth-switch">
						Already have an account? <Link to="/login">Login</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default Register
