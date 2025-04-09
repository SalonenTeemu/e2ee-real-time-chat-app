import { useState, useEffect, useRef } from 'react';
import { format, isValid } from 'date-fns';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { fetchWithAuth } from '../../utils/fetch';
import { validateUserSearchTerm, validateMessage } from '../../utils/validate';
import { sanitizeMessage } from '../../utils/sanitize';
import { decryptMessage, encryptMessage } from '../../utils/encryption';
import { getSharedKey } from '../../services/key/keys';

/**
 * The Chat component.
 *
 * @returns {JSX.Element} The Chat component
 */
const Chat = () => {
	const notificationContext = useNotification();
	const authContext = useAuth();
	const user = authContext.user;
	const [searchTerm, setSearchTerm] = useState('');
	const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
	const [chats, setChats] = useState<{ id: string; username: string }[]>([]);
	const [selectedChat, setSelectedChat] = useState<string | null>(null);
	const [messages, setMessages] = useState<{ senderId: string; content: string; createdAt: string }[]>([]);
	const [message, setMessage] = useState('');
	const [isSearchVisible, setSearchVisible] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	const selectedChatRef = useRef(selectedChat);
	const chatsRef = useRef(chats);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	// Update ref whenever 'selectedChat' changes
	useEffect(() => {
		selectedChatRef.current = selectedChat;
	}, [selectedChat]);

	// Keep the ref updated whenever 'chats' changes
	useEffect(() => {
		chatsRef.current = chats;
	}, [chats]);

	// Fetch chats and connect socket when user is logged in
	useEffect(() => {
		if (user) {
			getChats();
			connectSocket(notificationContext, handleReceiveMessage);
		}

		return () => {
			disconnectSocket();
		};
	}, [user]);

	// Trigger scroll when messages are updated
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Scroll to the bottom of the messages list
	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	};

	/**
	 * Retrieves the chats for the current user.
	 */
	const getChats = async () => {
		try {
			const res = await fetchWithAuth(
				`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/chat`,
				{},
				notificationContext.addNotification,
				authContext.logout
			);
			if (!res) return;

			const data = await res.json();
			if (!res.ok) {
				notificationContext.addNotification('error', `Error: ${data.message}.`);
				return;
			}
			setChats(data.message);
		} catch (error) {
			notificationContext.addNotification('error', 'Error fetching chats.');
			console.error('Error fetching chats:', error);
		}
	};

	/**
	 * Handles incoming messages via socket by decrypting open chat messages and showing notifications for others.
	 */
	const handleReceiveMessage = async (data: { chatId: string; senderId: string; content: string; createdAt: string }) => {
		if (!user) return;

		const sharedKey = await retrieveSharedKey(data.chatId, user.id);
		if (!sharedKey) return;

		const decryptedMessage = await decryptMessage(data.content, sharedKey);

		// Check if the message is for the currently selected chat
		if (selectedChatRef.current === data.chatId) {
			setMessages((prevMessages) => [...prevMessages, { senderId: data.senderId, content: decryptedMessage, createdAt: data.createdAt }]);
		} else {
			let chat = chatsRef.current.find((chat) => chat.id === data.chatId);
			if (!chat) {
				// If chat is not found in the current chats, fetch it from the server
				try {
					const res = await fetchWithAuth(
						`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/chat/${data.chatId}`,
						{},
						notificationContext.addNotification,
						authContext.logout
					);
					if (!res) return;
					const chatData = await res.json();

					if (res.ok) {
						chat = { id: chatData.message.chatId, username: chatData.message.username };
						if (chat) {
							setChats((prev) => (chat ? [...prev, chat] : prev));
						}
					} else {
						console.error(`Failed to fetch chat details: ${chatData.message}`);
					}
				} catch (error) {
					console.error('Error fetching chat details:', error);
				}
			}

			// Show notification for the received message
			const senderName = chat ? chat.username : 'Unknown';
			notificationContext.addNotification('info', `${senderName}: ${decryptedMessage}`);
		}
	};

	/**
	 * Retrieves the users based on the search term.
	 */
	const searchUsers = async () => {
		const sanitizedSearchTerm = sanitizeMessage(searchTerm);
		// Validate the search term
		if (!sanitizedSearchTerm.trim() || !validateUserSearchTerm(sanitizedSearchTerm)) {
			notificationContext.addNotification('error', 'Invalid search term.');
			return;
		}

		try {
			const res = await fetchWithAuth(
				`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/users/search?searchTerm=${sanitizedSearchTerm}`,
				{},
				notificationContext.addNotification,
				authContext.logout
			);
			if (!res) return;

			const data = await res.json();
			if (!res.ok) {
				notificationContext.addNotification('error', `Error: ${data.message}.`);
				return;
			}
			// Filter out users there are already chats with
			const filteredUsers = data.message.filter((user: { username: string }) => !chats.some((chat) => chat.username === user.username));
			setUsers(filteredUsers);
			setHasSearched(true);
		} catch (error) {
			notificationContext.addNotification('error', 'Error fetching users.');
			console.error('Error fetching users:', error);
		}
	};

	/**
	 * Starts a chat with other user.
	 *
	 * @param otherUserId The other user's ID
	 */
	const startChat = async (otherUserId: string) => {
		try {
			const res = await fetchWithAuth(
				`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/chat/start`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ userId: otherUserId }),
				},
				notificationContext.addNotification,
				authContext.logout
			);
			if (!res) return;

			const data = await res.json();
			if (!res.ok) {
				notificationContext.addNotification('error', `Error: ${data.message}.`);
				return;
			}
			setChats((prev) => {
				const isDuplicate = prev.some((chat) => chat.id === data.message.chatId);
				if (!isDuplicate) {
					return [...prev, { id: data.message.chatId, username: data.message.username }];
				}
				return prev;
			});
			// Open the chat after starting it
			openChat(data.message.chatId);
		} catch (error) {
			notificationContext.addNotification('error', 'Error starting chat.');
			console.error('Error starting chat:', error);
		}
	};

	/**
	 * Opens a chat and retrieves the messages for the chat using the chat ID and the shared key.
	 *
	 * @param chatId The chat ID
	 */
	const openChat = async (chatId: string) => {
		if (!user) return;

		setMessages([]);
		setSelectedChat(chatId);

		try {
			const res = await fetchWithAuth(
				`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}/api/message/${chatId}`,
				{},
				notificationContext.addNotification,
				authContext.logout
			);
			if (!res) return;

			const data = await res.json();
			if (!res.ok) {
				notificationContext.addNotification('error', `Error: ${data.message}.`);
				return;
			}

			if (data.message.length === 0) {
				return;
			}

			const sharedKey = await retrieveSharedKey(chatId, user.id);
			if (!sharedKey) return;

			const decryptedMessages = [];
			let errorOccurred = false;
			for (const msg of data.message) {
				try {
					const decryptedContent = await decryptMessage(msg.content, sharedKey);
					decryptedMessages.push({
						...msg,
						content: decryptedContent,
					});
				} catch (error) {
					errorOccurred = true;
					console.error('Error decrypting message:', error);
				}
			}

			if (errorOccurred) {
				notificationContext.addNotification('info', 'Some messages could not be decrypted and are missing.');
			}

			setMessages(decryptedMessages);
		} catch (error) {
			notificationContext.addNotification('error', 'Error fetching messages.');
			console.error('Error fetching messages:', error);
		}
	};

	/**
	 * Closes the selected chat.
	 */
	const closeChat = () => {
		setSelectedChat(null);
		setMessages([]);
	};

	/**
	 * Send a message related to the selected chat encrypted with the shared key.
	 */
	const sendMessage = async () => {
		if (!user || !selectedChat) return;

		// Sanitize the message and validate it
		const sanitizedMessage = sanitizeMessage(message);
		if (message.trim() !== '' && selectedChat && validateMessage(sanitizedMessage)) {
			try {
				const sharedKey = await retrieveSharedKey(selectedChat, user.id);
				if (!sharedKey) return;

				const encryptedMessage = await encryptMessage(sanitizedMessage, sharedKey);

				getSocket().emit('sendMessage', {
					chatId: selectedChat,
					content: encryptedMessage,
				});

				setMessage('');
			} catch (error) {
				notificationContext.addNotification('error', 'Error encrypting message.');
				console.error('Encryption error:', error);
			}
		} else {
			notificationContext.addNotification('error', 'Invalid message. Message must be between 1 and 1000 characters.');
		}
	};

	/**
	 * Retrieves the shared key for encryption/decryption in the chat. Display error messages based on the error type in case of failure.
	 *
	 * @param chatId The chat ID
	 * @param userId The user ID to retrieve the shared key for
	 * @returns {Uint8Array} The shared key
	 * @throws {Error} If the shared key cannot be retrieved
	 */
	const retrieveSharedKey = async (chatId: string, userId: string) => {
		try {
			const sharedKey = await getSharedKey(chatId, userId);
			return sharedKey;
		} catch (error: any) {
			// Display error messages based on the error type
			if (error.message === 'ActionCanceled') {
				notificationContext.addNotification('info', 'Password is required to view and send messages.');
			} else if (error.message === 'IncorrectPassword') {
				notificationContext.addNotification('error', 'Incorrect password. Please try again.');
			} else if (error.message === 'RecipientPublicKeyNotFound') {
				notificationContext.addNotification('error', 'Recipient has not accessed the application yet and cannot be contacted.');
			} else if (error.message === 'NoEncryptedKey') {
				notificationContext.addNotification('error', 'No encrypted key found.');
			} else {
				notificationContext.addNotification('error', 'Error retrieving shared key.');
			}
			closeChat();
			return null;
		}
	};

	/**
	 * Group the messages by date.
	 */
	const groupedMessages = messages.reduce(
		(acc, msg) => {
			const messageDate = new Date(msg.createdAt);
			if (!isValid(messageDate)) {
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
		<div className="flex h-screen bg-gray-100">
			<div className="flex h-full w-1/3 flex-col bg-white p-6 shadow-md">
				<div className="mb-6">
					<h3 className="mb-2 text-xl font-semibold text-gray-800">Active Chats</h3>
					<ul className="rounded-lg border border-gray-300">
						{chats.map((chat, index) => (
							<li
								key={`${chat.id}-${chat.username}`}
								className={`flex items-center justify-between p-2 ${index !== chats.length - 1 ? 'border-b border-gray-300' : ''}`}
							>
								<span>Chat with {chat.username}</span>
								<button
									onClick={() => openChat(chat.id)}
									className="cursor-pointer rounded-lg bg-blue-500 px-4 py-1 text-white hover:bg-blue-600"
								>
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
					className="mb-4 w-full cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
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
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									searchUsers();
								}
							}}
							className="mb-2 w-full rounded-lg border border-gray-300 p-2"
						/>
						<button onClick={searchUsers} className="w-full cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
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
										className="cursor-pointer rounded-lg bg-green-600 px-4 py-1 text-white hover:bg-green-700"
									>
										Start Chat
									</button>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			<div className="flex h-full w-2/3 flex-col p-6 pb-18">
				{selectedChat && (
					<div className="flex h-full flex-col">
						<h3 className="mb-2 flex items-center justify-between text-xl font-semibold text-gray-800">
							<span>Chat with {chats.find((chat) => chat.id === selectedChat)?.username}</span>
							<button
								onClick={() => closeChat()}
								className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-base text-white hover:bg-red-900"
							>
								Close Chat
							</button>
						</h3>

						<ul className="mb-2 flex-grow overflow-y-auto rounded-lg border border-gray-300 p-2">
							{messages.length === 0 ? (
								<li className="mt-4 text-center text-gray-500">No messages yet</li>
							) : (
								Object.keys(groupedMessages).map((date) => (
									<div key={date}>
										<li className="mb-1 rounded-lg bg-gray-700 p-1 text-center text-gray-500 text-white">
											{format(new Date(date), 'PP')}
										</li>
										{groupedMessages[date].map((msg) => (
											<li
												key={`${msg.senderId}-${msg.createdAt}`}
												className={`mb-1 rounded-lg p-2 ${
													msg.senderId === user.id ? 'bg-blue-200 text-left' : 'bg-gray-300 text-right'
												}`}
											>
												<div>{msg.content}</div>
												<div className="text-xs text-gray-500">{format(new Date(msg.createdAt), 'HH:mm')}</div>
											</li>
										))}
									</div>
								))
							)}
							<div ref={messagesEndRef}></div>
						</ul>

						<div className="flex">
							<input
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										sendMessage();
									}
								}}
								className="mr-2 flex-grow rounded-lg border border-gray-300 p-2"
								placeholder="Write a message..."
							/>
							<button onClick={sendMessage} className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
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
