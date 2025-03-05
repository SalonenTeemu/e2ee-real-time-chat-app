import { useState, useEffect } from 'react';
import socket from '../services/socket';

const Chat = () => {
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<string[]>([]);

	useEffect(() => {
		socket.on('receiveMessage', (data) => {
			setMessages((prev) => [...prev, data]);
		});

		return () => {
			socket.off('receiveMessage');
		};
	}, []);

	const sendMessage = () => {
		if (message.trim() !== '') {
			socket.emit('sendMessage', message);
			setMessage('');
		}
	};

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
