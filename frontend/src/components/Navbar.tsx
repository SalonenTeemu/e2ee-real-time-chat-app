import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, LogOut } from 'lucide-react';

/**
 * The Navbar component.
 *
 * @returns {JSX.Element} The Navbar component
 */
const Navbar = () => {
	const { user, logout } = useAuth();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	/**
	 * Handles the logout action.
	 */
	const handleLogout = async () => {
		await logout();
		setDropdownOpen(false);
	};

	return (
		<nav className="fixed top-0 right-0 left-0 z-50 bg-gray-800 p-4 shadow-md">
			<div className="mx-auto flex w-full items-center justify-between">
				<div className="left-0 text-2xl font-bold text-white">
					<Link to="/" className="hover:text-gray-400">
						Real-Time Chat App
					</Link>
				</div>

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
							<button
								className="flex cursor-pointer items-center space-x-2"
								onClick={() => {
									setDropdownOpen(!dropdownOpen);
								}}
							>
								<span className="hover:text-gray-400">
									Logged in as: <span className="font-semibold">{user.username}</span>
								</span>
								<ChevronDown className="h-5 w-5" />
							</button>

							{dropdownOpen && (
								<div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg">
									<button
										onClick={handleLogout}
										className="flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-gray-700 hover:bg-gray-300"
									>
										<LogOut className="h-5 w-5" />
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
