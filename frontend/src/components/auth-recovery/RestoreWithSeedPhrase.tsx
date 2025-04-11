import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { createKeyPair } from '../../services/key/keys';
import { sanitizeMessage } from '../../utils/sanitize';
import { validatePassword, validateSeedPhrase } from '../../utils/validate';

/**
 * The RestoreWithSeedPhrase component used to restore a private key using a seed phrase.
 *
 * @returns {JSX.Element} The RestoreWithSeedPhrase component
 */
const RestoreWithSeedPhrase = () => {
	const [mnemonic, setMnemonic] = useState<string[]>(Array(24).fill(''));
	const [password, setPassword] = useState('');
	const [isPasswordValid, setIsPasswordValid] = useState(true);
	const navigate = useNavigate();
	const authContext = useAuth();
	const user = authContext.user;
	const notificationContext = useNotification();
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	/**
	 * Handles the change event for the mnemonic input fields.
	 *
	 * @param index The index of the mnemonic word
	 * @param value The value of the mnemonic word
	 */
	const handleMnemonicChange = (index: number, value: string) => {
		const updatedMnemonic = [...mnemonic];
		updatedMnemonic[index] = value.trim();
		setMnemonic(updatedMnemonic);
	};

	/**
	 * Handles the key down event for the mnemonic input fields.
	 *
	 * @param index The index of the mnemonic word
	 * @param e The keyboard event
	 */
	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !mnemonic[index] && index > 0) {
			// Move to the previous input on backspace if the current one is empty
			inputRefs.current[index - 1]?.focus();
		} else if (e.key === 'ArrowLeft' && index > 0) {
			// Move to the previous input with the left arrow key
			inputRefs.current[index - 1]?.focus();
		} else if (e.key === 'ArrowRight' && index < 23) {
			// Move to the next input with the right arrow key
			inputRefs.current[index + 1]?.focus();
		} else if (e.key === ' ' && index < 23) {
			// Move to the next input when the spacebar is pressed
			inputRefs.current[index + 1]?.focus();
			e.preventDefault();
		}
	};

	/**
	 * Handles the paste event for the mnemonic input fields.
	 *
	 * @param e The paste event
	 */
	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		e.preventDefault();
		const pastedText = sanitizeMessage(e.clipboardData.getData('text').trim());
		if (!validateSeedPhrase(pastedText)) {
			notificationContext.addNotification('error', 'Invalid seed phrase format. Please enter a valid 24-word seed phrase.');
			return;
		}
		const words = pastedText.split(/\s+/);
		setMnemonic(words);
	};

	/**
	 * Handles the password validation by sending a request to the server.
	 *
	 * @returns {boolean} True if the password is valid, false otherwise
	 */
	const handlePasswordValidation = async () => {
		// Validate the password
		if (!password || !validatePassword(password)) {
			setIsPasswordValid(false);
			notificationContext.addNotification(
				'error',
				'Password must be between 12 and 100 characters and have lower case, upper case, number, and a special character.'
			);
			return false;
		}

		try {
			const res = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/auth/verify-password`, {
				method: 'POST',
				body: JSON.stringify({ password }),
				headers: {
					'Content-Type': 'application/json',
				},
			});
			const data = await res.json();
			if (!res.ok) {
				setIsPasswordValid(false);
				notificationContext.addNotification('error', `Error: ${data.message}`);
				return false;
			}
			if (!user) {
				notificationContext.addNotification('error', 'Not authenticated. Please log in again.');
				return false;
			}
		} catch {
			notificationContext.addNotification('error', 'Error verifying password. Please try again.');
			return false;
		}
	};

	/**
	 * Handles the restore action by creating a key pair using the provided mnemonic and password.
	 */
	const handleRestore = async () => {
		if (!(await handlePasswordValidation())) return;

		try {
			if (!user) return;

			// Create a key pair using the mnemonic and password and store the encrypted private key in the indexed database
			await createKeyPair(password, user.id, mnemonic.join(' '));
			notificationContext.addNotification('success', 'Restored successfully. Start chatting!');
			navigate('/chat');
		} catch {
			notificationContext.addNotification('error', 'Failed to restore from the given seed phrase. Please try again.');
		}
	};

	/**
	 * Handles the clear action by resetting the mnemonic and password fields.
	 */
	const handleClear = () => {
		setMnemonic(Array(24).fill(''));
		setPassword('');
		setIsPasswordValid(true);
	};

	if (!user) {
		return <p className="mt-16 text-center text-xl text-red-500">You need to be logged in to view this page.</p>;
	}

	return (
		<div className="flex h-screen items-center justify-center bg-gray-200">
			<div className="rounded-lg bg-gray-100 p-6 shadow-md">
				<h2 className="mb-6 text-center text-2xl font-bold text-blue-700">Restore Private Key With Seed Phrase</h2>
				<p className="mb-4 text-center text-gray-700">
					<strong>Enter your 24-word seed phrase below to restore your private key in this environment and to start chatting again:</strong>
				</p>
				<div className="mb-4 grid grid-cols-6 gap-2" onPaste={handlePaste}>
					{mnemonic.map((word, index) => (
						<input
							key={index}
							ref={(el) => {
								inputRefs.current[index] = el;
							}}
							type="text"
							value={word}
							onChange={(e) => handleMnemonicChange(index, e.target.value)}
							onKeyDown={(e) => handleKeyDown(index, e)}
							className="w-full rounded border border-gray-300 p-2 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder={`Word ${index + 1}`}
						/>
					))}
				</div>
				<input
					type="password"
					placeholder="Enter your account password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className={`mb-4 w-full rounded border p-2 focus:outline-none ${
						isPasswordValid ? 'border-gray-300' : 'border-red-500'
					} focus:ring-2 ${isPasswordValid ? 'focus:ring-blue-500' : 'focus:ring-red-500'}`}
				/>
				<div className="flex justify-between">
					<button
						onClick={handleClear}
						className="cursor-pointer rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none"
					>
						Clear Fields
					</button>
					<button
						onClick={handleRestore}
						className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none"
					>
						Restore
					</button>
				</div>
			</div>
		</div>
	);
};

export default RestoreWithSeedPhrase;
