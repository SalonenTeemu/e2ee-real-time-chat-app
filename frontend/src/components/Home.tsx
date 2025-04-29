import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * The Home component.
 *
 * @returns {JSX.Element} The Home component
 */
const Home = () => {
	const { user } = useAuth();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-6 text-center">
			<h1 className="mb-4 text-4xl font-bold text-blue-700">Welcome to E2EE Real-Time Chat App!</h1>
			<p className="mb-2 text-lg text-gray-700">Chat securely with end-to-end encryption in real-time.</p>
			{user ? (
				<>
					<p className="mb-6 text-lg text-gray-700">You are logged in. Start chatting now!</p>
					<Link to="/chat" className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
						Go to Chat
					</Link>
				</>
			) : (
				<>
					<p className="mb-6 text-lg text-gray-700">Login or register to start chatting.</p>
					<div className="flex gap-4">
						<Link to="/login" className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
							Login
						</Link>
						<Link to="/register" className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
							Register
						</Link>
					</div>
				</>
			)}
		</div>
	);
};

export default Home;
