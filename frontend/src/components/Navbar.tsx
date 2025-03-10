import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
	const { user, logout } = useAuth();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const handleLogout = async () => {
		await logout();
	};

	return (
		<nav className="bg-gray-800 p-4">
			<div className="mx-auto flex max-w-7xl items-center justify-between">
				<h1 className="text-2xl font-bold text-white">Chat App</h1>
				{user && (
					<div className="relative">
						<button className="flex items-center space-x-2 text-white" onClick={() => setDropdownOpen(!dropdownOpen)}>
							<span>Logged in as: {user.username}</span>
							<svg
								className="h-4 w-4 text-white"
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
								<button onClick={handleLogout} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-200">
									Logout
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
