import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * The Navbar component.
 *
 * @returns {JSX.Element} The Navbar component.
 */
const Navbar = () => {
	const { user, logout } = useAuth();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	/**
	 * Handles the logout action.
	 */
	const handleLogout = async () => {
		await logout();
	};

	return (
		<nav className="bg-gray-800 p-4">
			<div className="mx-auto flex w-full items-center justify-between">
				<div className="left-0 text-2xl font-bold text-white">Real-Time Chat App</div>

				<div className="absolute left-1/2 -translate-x-1/2 transform space-x-6 text-lg">
					<Link to="/" className="font-semibold text-white hover:text-gray-400">
						Home
					</Link>
					{user && (
						<Link to="/chat" className="font-semibold text-white hover:text-gray-400">
							Chat
						</Link>
					)}
				</div>

				<div className="relative text-white">
					{user ? (
						<>
							<button className="flex items-center space-x-2" onClick={() => setDropdownOpen(!dropdownOpen)}>
								<span>Logged in as: {user.username}</span>
								<svg
									className="h-4 w-4"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clipRule="evenodd"
									/>
								</svg>
							</button>

							{dropdownOpen && (
								<div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg">
									<button
										onClick={handleLogout}
										className="w-full rounded-md px-4 py-2 text-center text-gray-700 hover:bg-gray-400"
									>
										Logout
									</button>
								</div>
							)}
						</>
					) : (
						<div className="space-x-4">
							<Link to="/login" className="text-lg font-semibold text-white hover:text-gray-400">
								Login
							</Link>
							<Link to="/register" className="text-lg font-semibold text-white hover:text-gray-400">
								Register
							</Link>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
