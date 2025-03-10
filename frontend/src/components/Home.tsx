import { Link } from 'react-router-dom';

/**
 * The Home component.
 *
 * @returns {JSX.Element} The Home component.
 */
function Home() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-6 text-center">
			<h1 className="mb-4 text-4xl font-bold text-blue-700">Welcome to Secure Real-Time Chat App!</h1>
			<p className="mb-2 text-lg text-gray-600">Chat securely with others in real-time.</p>
			<p className="mb-8 text-lg text-gray-600">Login or register to start chatting.</p>
			<div className="flex gap-4">
				<Link to="/login" className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
					Login
				</Link>
				<Link to="/register" className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600">
					Register
				</Link>
			</div>
		</div>
	);
}

export default Home;
