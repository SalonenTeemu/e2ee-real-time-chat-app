import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { env } from '../../utils/env';
import { useNotification } from '../../context/NotificationContext';
import { validateRegisterAndLogin } from '../../utils/validate';

/**
 * The Register component.
 *
 * @returns {JSX.Element} The Register component
 */
const Register = () => {
	const notificationContext = useNotification();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const navigate = useNavigate();

	/**
	 * Handles the register form submission.
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

		if (password !== confirmPassword) {
			setErrorMessage('Passwords do not match.');
			return;
		}

		try {
			const res = await fetch(`http://localhost:${env.VITE_BACKEND_PORT}/api/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username,
					password,
				}),
			});

			if (res.ok) {
				notificationContext.addNotification('success', 'Registration successful. Please log in.');
				navigate('/login');
			} else {
				const data = await res.json();
				setErrorMessage(`${data.message}.`);
			}
		} catch (error: any) {
			setErrorMessage(error.response?.data?.message || 'Registration failed.');
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-blue-50 p-6">
			<div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
				<h2 className="mb-6 text-center text-2xl font-bold text-blue-700">Register</h2>
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

					<div className="mb-4">
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

					<div className="mb-6">
						<label className="block text-gray-700" htmlFor="confirmPassword">
							Confirm Password
						</label>
						<input
							type="password"
							id="confirmPassword"
							className="mt-2 w-full rounded-md border border-gray-300 p-2"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
						/>
					</div>

					{errorMessage && <p className="mb-4 text-center text-sm text-red-500">{errorMessage}</p>}

					<button type="submit" className="w-full cursor-pointer rounded-lg bg-green-600 py-2 text-white hover:bg-green-700">
						Register
					</button>
				</form>

				<div className="mt-4 text-center">
					<p className="text-gray-700">
						Already have an account?{' '}
						<Link to="/login" className="text-blue-500 hover:text-blue-600">
							Login here
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Register;
