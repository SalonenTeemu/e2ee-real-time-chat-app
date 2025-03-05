import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';

function App() {
	return (
		<Router>
			<div className="main-content">
				<Routes>
					<Route path="/" element={<h1>Welcome to Chat App!</h1>} />
					<Route path="/chat" element={<Chat />} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;
