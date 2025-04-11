import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { createKeyPair } from '../../services/key/keys';

const RestoreWithSeedPhrase = () => {
	const [mnemonic, setMnemonic] = useState('');
	const [password, setPassword] = useState('');
	const navigate = useNavigate();
	const authContext = useAuth();
	const user = authContext.user;
	const notificationContext = useNotification();

	const handleRestore = async () => {
		await authContext.fetchUser(); // Fetch user data to ensure user is authenticated
		try {
			if (!user) {
				notificationContext.addNotification('error', 'User is not authenticated.');
				return;
			}
			await createKeyPair(password, user.id, mnemonic);
			notificationContext.addNotification('success', 'Restored successfully!');
			navigate('/chat');
		} catch {
			notificationContext.addNotification('error', 'Failed to restore from seed phrase.');
		}
	};

	return (
		<div className="p-6">
			<h2 className="mb-4 text-xl font-bold">Restore Account with Seed Phrase</h2>
			<textarea
				value={mnemonic}
				onChange={(e) => setMnemonic(e.target.value)}
				className="mb-4 w-full border p-2"
				rows={3}
				placeholder="Enter your 12-word seed phrase"
			/>
			<input
				type="password"
				placeholder="Create a password to store the key"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				className="mb-4 w-full border p-2"
			/>
			<button onClick={handleRestore} className="rounded bg-blue-500 px-4 py-2 text-white">
				Restore
			</button>
		</div>
	);
};

export default RestoreWithSeedPhrase;
