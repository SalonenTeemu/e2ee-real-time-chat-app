import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Chat from './components/chat/Chat';
import RestoreWithSeedPhrase from './components/auth-recovery/RestoreWithSeedPhrase';

/**
 * The main component of the application.
 *
 * @returns {JSX.Element} The App component
 */
const App = () => {
	return (
		<Router>
			<NotificationProvider>
				<AuthProvider>
					<Navbar />
					<div className="main-content pt-14">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/login" element={<Login />} />
							<Route path="/register" element={<Register />} />
							<Route path="/chat" element={<Chat />} />
							<Route path="/restore-with-phrase" element={<RestoreWithSeedPhrase />} />
						</Routes>
					</div>
				</AuthProvider>
			</NotificationProvider>
		</Router>
	);
};

export default App;
