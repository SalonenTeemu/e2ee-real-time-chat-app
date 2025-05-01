import React, { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

// Define the props for the SeedPhraseModal component
interface SeedPhraseModalProps {
	seedPhrase: string;
	onAcknowledge: () => void;
}

/**
 * The SeedPhraseModal component used to display the seed phrase to the user.
 *
 * @param {SeedPhraseModalProps} param0 The props for the SeedPhraseModal component
 * @returns {JSX.Element} The SeedPhraseModal component
 */
const SeedPhraseModal: React.FC<SeedPhraseModalProps> = ({ seedPhrase, onAcknowledge }) => {
	const notificationContext = useNotification();
	const [copied, setCopied] = useState(false);

	// Prevent the user from accidentally leaving the page with the seed phrase displayed
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, []);

	/**
	 * Handles the copy button click event by copying the seed phrase to the clipboard and displaying a success message.
	 */
	const handleCopy = () => {
		navigator.clipboard
			.writeText(seedPhrase)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000); // Hide the message after 2 seconds
			})
			.catch(() => {
				notificationContext.addNotification('error', 'Failed to copy seed phrase. Please try again.');
			});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
				<h2 className="mb-4 text-center text-xl font-bold text-blue-700">Save Your Seed Phrase</h2>
				<p className="mb-4 text-gray-700">
					<strong>This is your unique seed phrase. Store it in a safe and secure place. </strong>
					It is critical for recovering your private key on other devices or browsers.
					<strong> If you lose this phrase, you will not be able to read or send messages.</strong>
					<strong className="mt-4 block text-red-500">Do not share the phrase with anyone!</strong>
				</p>
				<div className="relative mb-4 flex items-center justify-between rounded-md bg-gray-200 p-4 text-gray-700">
					<code className="mb-4 font-mono text-lg">{seedPhrase}</code>
					<div className="absolute right-0 bottom-2 flex flex-col items-center">
						<span className={`mb-1 text-sm text-green-600 ${copied ? 'visible' : 'invisible'}`}>Copied!</span>
						<button onClick={handleCopy} className="text-blue-500 hover:text-blue-700">
							<Copy className="h-5 w-5 cursor-pointer" />
						</button>
					</div>
				</div>
				<p className="mb-4 text-gray-700">
					<strong>Important:</strong> Write it down and keep it somewhere secure. You won&apos;t be able to use your account without it.
				</p>
				<button onClick={onAcknowledge} className="w-full cursor-pointer rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600">
					I have saved my seed phrase
				</button>
			</div>
		</div>
	);
};

export default SeedPhraseModal;
