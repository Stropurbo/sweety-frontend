import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import routes from './routes'

const App = () => (
	<BrowserRouter>
		<AuthProvider>
			<Routes>
				{routes.map(({ path, element }) => (
					<Route key={path} path={path} element={element} />
				))}
			</Routes>
		</AuthProvider>
	</BrowserRouter>
)

export default App
