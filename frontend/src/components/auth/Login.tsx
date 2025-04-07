import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { fetchWithAuth } from '../../utils/fetch';
import { validateRegisterAndLogin } from '../../utils/validate';
import { createKeyPair, getDecryptedPrivateKey } from '../../services/key/keys';

/**
 * The Login component.
 *
 * @returns {JSX.Element} The Login component
 */
const Login = () => {
	const authContext = useAuth();
	const notificationContext = useNotification();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const navigate = useNavigate();

	/**
	 * Handles the login form submission.
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setErrorMessage('');

		// Validate username and password
		const validation = validateRegisterAndLogin(username, password);
		if (!validation.success) {
			setErrorMessage(validation.message || 'An error occurred.');
			return;
		}

		try {
			const res = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username,
					password,
				}),
				credentials: 'include',
			});

			const data = await res.json();

			if (res.ok) {
				const userId = data.userId;
				if (data.requiresPublicKey) {
					// Generate and save the public key
					const publicKey = await createKeyPair(password, userId);
					if (!publicKey) {
						setErrorMessage('Failed to generate public key.');
						return;
					}

					// Save the public key to the backend
					const keyRes = await fetchWithAuth(
						`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/key`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({ publicKey }),
						},
						notificationContext.addNotification,
						authContext.logout
					);
					if (!keyRes) {
						setErrorMessage('Failed to save public key.');
						return;
					}
				}
				// Fetch the user data and decrypt the private key
				await authContext.fetchUser();
				await getDecryptedPrivateKey(userId, password);
				notificationContext.addNotification('success', 'Welcome!');
				navigate('/chat');
			} else {
				setErrorMessage(`${data.message}.`);
			}
		} catch (error: any) {
			setErrorMessage(error.response?.data?.message || 'Login failed. Please try again.');
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-blue-50 p-6">
			<div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
				<h2 className="mb-6 text-center text-2xl font-bold text-blue-700">Login</h2>
				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="block text-gray-700" htmlFor="username">
							Username
						</label>
						<input
							type="text"
							id="username"
							className="mt-2 w-full rounded-md border border-gray-300 p-2"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700" htmlFor="password">
							Password
						</label>
						<input
							type="password"
							id="password"
							className="mt-2 w-full rounded-md border border-gray-300 p-2"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					{errorMessage && <p className="mb-4 text-center text-sm text-red-500">{errorMessage}</p>}

					<button type="submit" className="w-full rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600">
						Login
					</button>
				</form>

				<div className="mt-4 text-center">
					<p className="text-gray-600">
						Don&apos;t have an account?{' '}
						<Link to="/register" className="text-blue-500 hover:text-blue-600">
							Register here
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Login;
