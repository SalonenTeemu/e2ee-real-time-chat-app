import { useState } from 'react';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { validateUserSearchTerm } from '../../utils/validate';

const Chat = () => {
	const { user } = useAuth();
	const [searchTerm, setSearchTerm] = useState('');
	const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
	const [chatId, setChatId] = useState('');
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<string[]>([]);

	// Search users
	const searchUsers = async () => {
		if (!searchTerm.trim() || !validateUserSearchTerm(searchTerm)) {
			alert('Invalid search term');
			return;
		}

		try {
			const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/search?searchTerm=${searchTerm}`, {
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				alert(`Error: ${data.message}.`);
				return;
			}
			setUsers(data.message);
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	};

	// Start or fetch chat
	const startChat = async (otherUserId: string) => {
		try {
			const res = await fetch('/api/chat/start', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ userId: otherUserId }),
			});
			const data = await res.json();
			if (!res.ok) {
				alert(`Error: ${data.message}.`);
				return;
			}
			setChatId(data.chatId);

			// Join the chat room in Socket.IO
			socket.emit('joinChat', data.chatId);

			// Listen for messages in the specific room
			socket.on('receiveMessage', (data) => {
				setMessages((prev) => [...prev, data]);
			});
		} catch (error) {
			console.error('Error starting chat:', error);
		}
	};

	const sendMessage = () => {
		if (message.trim() !== '') {
			socket.emit('sendMessage', { chatId, message });
			setMessage('');
		}
	};

	if (!user) {
		return <p className="text-center text-red-500">You need to be logged in to view this page.</p>;
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
			<h2 className="mb-4 text-3xl font-bold text-blue-700">Chat</h2>

			<div className="mb-6 w-full max-w-md">
				<input
					type="text"
					placeholder="Search for users to chat with..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full rounded-lg border border-gray-300 p-2"
				/>
				<button onClick={searchUsers} className="mt-2 w-full rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600">
					Search
				</button>
				<ul className="mt-4 space-y-2">
					{users.map((user) => (
						<li key={user.id} className="flex items-center justify-between rounded-lg bg-white p-2 shadow">
							<span>{user.username}</span>
							<button onClick={() => startChat(user.id)} className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600">
								Start Chat
							</button>
						</li>
					))}
				</ul>
			</div>

			<div className="w-full max-w-md">
				<div className="mb-4 rounded-lg bg-white p-4 shadow">
					<ul className="space-y-2">
						{messages.map((msg, i) => (
							<li key={i} className="rounded-lg bg-gray-200 p-2">
								{msg}
							</li>
						))}
					</ul>
				</div>

				<div className="flex space-x-2">
					<input value={message} onChange={(e) => setMessage(e.target.value)} className="flex-1 rounded-lg border border-gray-300 p-2" />
					<button onClick={sendMessage} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
						Send
					</button>
				</div>
			</div>
		</div>
	);
};

export default Chat;
