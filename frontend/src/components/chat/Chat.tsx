import { useState, useEffect } from 'react';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { validateUserSearchTerm, validateMessage } from '../../utils/validate';
import { sanitizeMessage } from '../../utils/sanitize';

/**
 * The Chat component.
 *
 * @returns {JSX.Element} The Chat component.
 */
const Chat = () => {
	const { user } = useAuth();
	const [searchTerm, setSearchTerm] = useState('');
	const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
	const [chats, setChats] = useState<{ id: string; username: string }[]>([]);
	const [selectedChat, setSelectedChat] = useState<string | null>(null);
	const [messages, setMessages] = useState<{ senderId: string; content: string }[]>([]);
	const [message, setMessage] = useState('');

	useEffect(() => {
		/**
		 * Retrieves the chats for the current user.
		 */
		const getChats = async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
					credentials: 'include',
				});
				const data = await res.json();
				if (!res.ok) {
					alert(`Error: ${data.message}.`);
					return;
				}
				setChats(data.message);
			} catch (error) {
				alert('Error fetching chats');
				console.error('Error fetching chats:', error);
			}
		};

		if (user) {
			getChats();
		}
	}, [user]);

	/**
	 * Retrieves the users based on the search term.
	 */
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
			alert('Error fetching users');
			console.error('Error fetching users:', error);
		}
	};

	/**
	 * Starts a chat with the other user.
	 *
	 * @param otherUserId The other user's ID
	 */
	const startChat = async (otherUserId: string) => {
		try {
			const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ userId: otherUserId }),
			});
			const data = await res.json();
			if (!res.ok) {
				alert(`Error: ${data.message}.`);
				return;
			}
			setSelectedChat(data.message.chatId);
			setChats((prev) => [...prev, { id: data.message.chatId, username: data.message.username }]);

			socket.emit('joinChat', data.chatId);

			socket.on('receiveMessage', (data) => {
				setMessages((prev) => [...prev, data]);
			});
		} catch (error) {
			alert('Error starting chat');
			console.error('Error starting chat:', error);
		}
	};

	/**
	 * Opens a chat.
	 *
	 * @param chatId The chat ID
	 */
	const openChat = async (chatId: string) => {
		setSelectedChat(chatId);

		socket.emit('joinChat', chatId);

		socket.off('receiveMessage'); // Clear previous listeners
		socket.on('receiveMessage', (data) => {
			if (data && data.senderId && data.content) {
				setMessages((prev) => [...prev, data]);
			}
		});
	};

	/**
	 * Send a message related to the selected chat.
	 */
	const sendMessage = () => {
		if (!user) return;
		if (message.trim() !== '' && selectedChat && validateMessage(message)) {
			const sanitizedMessage = sanitizeMessage(message);
			socket.emit('sendMessage', { chatId: selectedChat, senderId: user.id, content: sanitizedMessage });
			setMessages((prev) => [...prev, { senderId: user.id, content: sanitizedMessage }]);
			setMessage('');
		} else {
			alert('Invalid message');
		}
	};

	if (!user) {
		return <p className="mt-16 text-center font-bold text-red-500">You need to be logged in to view this page.</p>;
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
			<h2 className="mb-4 text-3xl font-bold text-gray-800">Chat</h2>

			<div className="mb-6 w-full max-w-md">
				<input
					type="text"
					placeholder="Search for users..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="mb-2 w-full rounded-lg border border-gray-300 p-2"
				/>
				<button onClick={searchUsers} className="w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
					Search
				</button>
				<ul className="mt-4">
					{users.map((user) => (
						<li key={user.id} className="flex items-center justify-between border-b border-gray-300 p-2">
							<span>{user.username}</span>
							<button onClick={() => startChat(user.id)} className="rounded-lg bg-green-500 px-4 py-1 text-white hover:bg-green-600">
								Start Chat
							</button>
						</li>
					))}
				</ul>
			</div>

			<div className="mb-6 w-full max-w-md">
				<h3 className="mb-2 text-xl font-semibold text-gray-800">Active Chats</h3>
				<ul className="rounded-lg border border-gray-300">
					{chats.map((chat) => (
						<li key={chat.id} className="flex items-center justify-between border-b border-gray-300 p-2">
							<span>Chat with {chat.username}</span>
							<button onClick={() => openChat(chat.id)} className="rounded-lg bg-blue-500 px-4 py-1 text-white hover:bg-blue-600">
								Open Chat
							</button>
						</li>
					))}
				</ul>
			</div>

			{selectedChat && (
				<div className="w-full max-w-md">
					<h3 className="mb-2 text-xl font-semibold text-gray-800">Chat Window</h3>
					<ul className="mb-2 h-64 overflow-y-auto rounded-lg border border-gray-300 p-2">
						{messages.map((msg, i) => (
							<li key={i} className="mb-1 rounded-lg bg-gray-200 p-2">
								<strong>{msg.senderId === user.id ? 'You' : chats.find((chat) => chat.id === selectedChat)?.username}:</strong>{' '}
								{msg.content}
							</li>
						))}
					</ul>
					<div className="flex">
						<input
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className="mr-2 flex-grow rounded-lg border border-gray-300 p-2"
						/>
						<button onClick={sendMessage} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
							Send
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Chat;
