import { useState, useEffect } from 'react';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const Chat = () => {
	const { user } = useAuth();
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<string[]>([]);

	useEffect(() => {
		if (!user) return;

		socket.on('receiveMessage', (data) => {
			setMessages((prev) => [...prev, data]);
		});

		return () => {
			socket.off('receiveMessage');
		};
	}, [user]);

	const sendMessage = () => {
		if (message.trim() !== '') {
			socket.emit('sendMessage', message);
			setMessage('');
		}
	};

	if (!user) {
		return <p>You need to be logged in to view this page.</p>;
	}

	return (
		<div>
			<h2>Chat</h2>
			<input value={message} onChange={(e) => setMessage(e.target.value)} />
			<button onClick={sendMessage}>Send</button>
			<ul>
				{messages.map((msg, i) => (
					<li key={i}>{msg}</li>
				))}
			</ul>
		</div>
	);
};

export default Chat;
