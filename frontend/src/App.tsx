import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Chat from './components/chat/Chat';

/**
 * The main component of the application.
 *
 * @returns {JSX.Element} The App component.
 */
function App() {
	return (
		<Router>
			<AuthProvider>
				<div className="main-content">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/chat" element={<Chat />} />
					</Routes>
				</div>
			</AuthProvider>
		</Router>
	);
}

export default App;
