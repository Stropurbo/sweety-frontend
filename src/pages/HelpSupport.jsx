import { useState } from 'react'
import Navbar from '../components/Navbar'
import '../styles/settings.css'

const FAQS = [
	{ q: 'How do I change my profile picture?', a: 'Go to your Profile page and click the camera icon on your avatar, or use Edit Profile button.' },
	{ q: 'How do I make a post private?', a: 'When creating a post, select 🔒 Private from the visibility dropdown. You can also change it later from the post menu.' },
	{ q: 'Can I delete my posts?', a: 'Yes. Click the ⋮ menu on any of your posts and select Delete Post.' },
	{ q: 'How do I change my password?', a: 'Go to Settings → Password & Security and fill in the change password form.' },
	{ q: 'How do I edit a post?', a: 'Click the ⋮ menu on your post and select Edit Post. You can change content, visibility, and media.' },
	{ q: 'Can I upload multiple photos/videos?', a: 'Yes! When creating a post, click the Photo or Video button multiple times to add multiple media files.' },
]

const HelpSupport = () => {
	const [openFaq, setOpenFaq] = useState(null)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [sent, setSent] = useState(false)

	const handleSubmit = (e) => {
		e.preventDefault()
		if (!name.trim() || !email.trim() || !message.trim()) return
		setSent(true)
	}

	return (
		<div className="settings-wrap">
			<Navbar />
			<div className="help-layout">

				{/* Hero */}
				<div className="help-hero">
					<h1>Help & Support</h1>
					<p>Find answers to common questions or reach out to us directly.</p>
				</div>

				<div className="help-body">
					{/* FAQ */}
					<div className="help-section">
						<h2 className="help-section-title">Frequently Asked Questions</h2>
						<div className="faq-list">
							{FAQS.map((faq, i) => (
								<div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
									<button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
										<span>{faq.q}</span>
										<span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
									</button>
									{openFaq === i && (
										<div className="faq-answer">{faq.a}</div>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Contact */}
					<div className="help-section">
						<h2 className="help-section-title">Contact Us</h2>
						{sent ? (
							<div className="help-sent">
								<span>✅</span>
								<h3>Message Sent!</h3>
								<p>We'll get back to you within 24 hours.</p>
								<button onClick={() => { setSent(false); setName(''); setEmail(''); setMessage('') }}>
									Send another message
								</button>
							</div>
						) : (
							<form className="help-form" onSubmit={handleSubmit}>
								<div className="help-form-row">
									<div className="settings-field">
										<label>Your Name</label>
										<input value={name} onChange={e => setName(e.target.value)}
											placeholder="Full name" required />
									</div>
									<div className="settings-field">
										<label>Email Address</label>
										<input type="email" value={email} onChange={e => setEmail(e.target.value)}
											placeholder="your@email.com" required />
									</div>
								</div>
								<div className="settings-field">
									<label>Message</label>
									<textarea value={message} onChange={e => setMessage(e.target.value)}
										rows={5} placeholder="Describe your issue or question..." required />
								</div>
								<button type="submit" className="settings-save-btn">Send Message</button>
							</form>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default HelpSupport
