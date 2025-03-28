import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Define the props for the PasswordModal component
interface PasswordModalProps {
	onSubmit: (password: string | null) => void;
	onClose: () => void;
}

/**
 * The PasswordModal component.
 *
 * @param param0 The props for the PasswordModal component.
 * @returns {JSX.Element} The rendered PasswordModal component.
 */
const PasswordModal: React.FC<PasswordModalProps> = ({ onSubmit, onClose }) => {
	const [password, setPassword] = useState('');

	/**
	 * Handle the submit button click event.
	 */
	const handleSubmit = () => {
		onSubmit(password);
		onClose();
	};

	/**
	 * Handle the cancel button click event.
	 */
	const handleCancel = () => {
		onSubmit(null);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-2xl">
				<h2 className="mb-4 text-center text-xl font-semibold text-gray-800">Enter Your Password To Proceed</h2>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Enter your password"
					className="mb-4 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
				/>
				<div className="flex justify-end space-x-2">
					<button onClick={handleSubmit} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none">
						Submit
					</button>
					<button onClick={handleCancel} className="rounded-lg bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 focus:outline-none">
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

/**
 * Shows the password modal.
 *
 * @returns A promise that resolves with the password entered by the user or null if cancelled.
 */
export const showPasswordModal = (): Promise<string | null> => {
	return new Promise((resolve) => {
		const modalContainer = document.createElement('div');
		document.body.appendChild(modalContainer);

		const root = createRoot(modalContainer);

		const handleClose = () => {
			root.unmount();
			document.body.removeChild(modalContainer);
		};

		root.render(<PasswordModal onSubmit={(password) => resolve(password)} onClose={handleClose} />);
	});
};

export default PasswordModal;
