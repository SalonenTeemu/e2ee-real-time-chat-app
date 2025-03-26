import { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { validateUserSearchTerm, validateMessage } from '../../utils/validate';
import { sanitizeMessage } from '../../utils/sanitize';
import { decryptMessage, encryptMessage } from '../../utils/encryption';
import { getSharedKey } from '../../utils/key';

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
	const [messages, setMessages] = useState<{ senderId: string; content: string; createdAt: string }[]>([]);
	const [message, setMessage] = useState('');
	const [isSearchVisible, setSearchVisible] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	useEffect(() => {
		/**
		 * Retrieves the chats for the current user.
		 */
		const getChats = async () => {
			try {
				const res = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/chat`, {
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

		/**
		 * Handles incoming messages via socket by decrypting them and adding them to the messages state.
		 */
		const handleReceiveMessage = async (data: { chatId: string; senderId: string; content: string; createdAt: string }) => {
			if (selectedChat === data.chatId) {
				const sharedKey = await getSharedKey(data.chatId);
				const decryptedMessage = await decryptMessage(data.content, sharedKey);
				setMessages((prev) => [...prev, { senderId: data.senderId, content: decryptedMessage, createdAt: data.createdAt }]);
			}
		};

		if (user) {
			getChats();
			socket.on('receiveMessage', handleReceiveMessage); // Add socket listener
		}

		return () => {
			socket.off('receiveMessage', handleReceiveMessage); // Clean up socket listener
		};
	}, [user, selectedChat]);

	/**
	 * Retrieves the users based on the search term.
	 */
	const searchUsers = async () => {
		if (!searchTerm.trim() || !validateUserSearchTerm(searchTerm)) {
			alert('Invalid search term');
			return;
		}

		try {
			const res = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/users/search?searchTerm=${searchTerm}`, {
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				alert(`Error: ${data.message}.`);
				return;
			}
			setUsers(data.message);
			setHasSearched(true);
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
			const res = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/chat/start`, {
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
			setChats((prev) => {
				const isDuplicate = prev.some((chat) => chat.id === data.message.chatId);
				if (!isDuplicate) {
					return [...prev, { id: data.message.chatId, username: data.message.username }];
				}
				return prev;
			});
			openChat(data.message.chatId);

			await getSharedKey(data.message.chatId);
			socket.on('receiveMessage', (data) => {
				setMessages((prev) => [...prev, data]);
			});
		} catch (error) {
			alert('Error starting chat');
			console.error('Error starting chat:', error);
		}
	};

	/**
	 * Opens a chat and retrieves the messages for the chat using the chat ID and the shared key.
	 *
	 * @param chatId The chat ID
	 */
	const openChat = async (chatId: string) => {
		closeChat();
		setSelectedChat(chatId);
		socket.emit('joinChat', chatId);

		try {
			const res = await fetch(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/message/${chatId}`, {
				credentials: 'include',
			});

			const data = await res.json();
			if (!res.ok) {
				alert(`Error: ${data.message}.`);
				return;
			}

			const sharedKey = await getSharedKey(chatId);

			const decryptedMessages = await Promise.all(
				data.message.map(async (msg: { senderId: string; content: string }) => ({
					...msg,
					content: await decryptMessage(msg.content, sharedKey),
				}))
			);

			setMessages(decryptedMessages);
		} catch (error) {
			alert('Error fetching messages');
			console.error('Error fetching messages:', error);
		}
	};

	/**
	 * Closes the selected chat.
	 */
	const closeChat = () => {
		setSelectedChat(null);
		socket.emit('leaveChat', selectedChat);
	};

	/**
	 * Send a message related to the selected chat encrypted with the shared key.
	 */
	const sendMessage = async () => {
		if (!user) return;

		const sanitizedMessage = sanitizeMessage(message);
		if (message.trim() !== '' && selectedChat && validateMessage(sanitizedMessage)) {
			try {
				const sharedKey = await getSharedKey(selectedChat);
				const encryptedMessage = await encryptMessage(sanitizedMessage, sharedKey);

				socket.emit('sendMessage', {
					chatId: selectedChat,
					senderId: user.id,
					content: encryptedMessage,
				});

				setMessage('');
			} catch (error) {
				alert('Error encrypting message');
				console.error('Encryption error:', error);
			}
		} else {
			alert('Invalid message');
		}
	};

	/**
	 * Group the messages by date.
	 */
	const groupedMessages = messages.reduce(
		(acc, msg) => {
			const messageDate = new Date(msg.createdAt);
			if (!isValid(messageDate)) {
				console.log(msg);

				console.error('Invalid date:', msg.createdAt);
				return acc;
			}
			const dateKey = format(messageDate, 'yyyy-MM-dd');
			if (!acc[dateKey]) {
				acc[dateKey] = [];
			}
			acc[dateKey].push(msg);
			return acc;
		},
		{} as { [key: string]: { senderId: string; content: string; createdAt: string }[] }
	);

	if (!user) {
		return <p className="mt-16 text-center text-xl text-red-500">You need to be logged in to view this page.</p>;
	}

	return (
		<div className="flex min-h-screen bg-gray-100">
			<div className="w-1/3 bg-white p-6 shadow-md">
				<div className="mb-6">
					<h3 className="mb-2 text-xl font-semibold text-gray-800">Active Chats</h3>
					<ul className="rounded-lg border border-gray-300">
						{chats.map((chat) => (
							<li key={`${chat.id}-${chat.username}`} className="flex items-center justify-between border-b border-gray-300 p-2">
								<span>Chat with {chat.username}</span>
								<button onClick={() => openChat(chat.id)} className="rounded-lg bg-blue-500 px-4 py-1 text-white hover:bg-blue-600">
									Open Chat
								</button>
							</li>
						))}
					</ul>
				</div>
				<button
					onClick={() => {
						setSearchVisible((prev) => !prev);
					}}
					className="mb-4 w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
				>
					{isSearchVisible ? 'Hide Search' : 'Search for users to chat with'}
				</button>

				{isSearchVisible && (
					<div className="mb-6">
						<input
							type="text"
							placeholder="Search for users to chat with..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="mb-2 w-full rounded-lg border border-gray-300 p-2"
						/>
						<button onClick={searchUsers} className="w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
							Search
						</button>
						{hasSearched && users.length === 0 && (
							<div className="mt-4">
								<p className="mb-2 text-center text-lg font-semibold text-gray-800">No users found with the search term.</p>
							</div>
						)}
						<ul className="mt-4">
							{users.map((user) => (
								<li key={user.id} className="flex items-center justify-between border-b border-gray-300 p-2">
									<span>{user.username}</span>
									<button
										onClick={() => startChat(user.id)}
										className="rounded-lg bg-green-500 px-4 py-1 text-white hover:bg-green-600"
									>
										Start Chat
									</button>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			<div className="w-2/3 p-6">
				{selectedChat && (
					<div>
						<h3 className="mb-2 flex items-center justify-between text-xl font-semibold text-gray-800">
							<span>Chat with {chats.find((chat) => chat.id === selectedChat)?.username}</span>
							<button onClick={() => closeChat()} className="rounded-lg bg-red-500 px-4 py-2 text-base text-white hover:bg-red-900">
								Close Chat
							</button>
						</h3>

						<ul className="mb-2 h-64 overflow-y-auto rounded-lg border border-gray-300 p-2">
							{Object.keys(groupedMessages).map((date) => (
								<div key={date}>
									<li className="mb-1 rounded-lg bg-gray-700 p-1 text-center text-gray-500 text-white">
										{format(new Date(date), 'PP')}
									</li>
									{groupedMessages[date].map((msg) => (
										<li
											key={`${msg.senderId}-${msg.createdAt}`}
											className={`mb-1 rounded-lg p-2 ${msg.senderId === user.id ? 'bg-blue-200 text-left' : 'bg-gray-300 text-right'}`}
										>
											<div>{msg.content}</div>
											<div className="text-xs text-gray-500">{format(new Date(msg.createdAt), 'HH:mm')}</div>
										</li>
									))}
								</div>
							))}
						</ul>
						<div className="flex">
							<input
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								className="mr-2 flex-grow rounded-lg border border-gray-300 p-2"
								placeholder="Write a message..."
							/>
							<button onClick={sendMessage} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
								Send
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Chat;
