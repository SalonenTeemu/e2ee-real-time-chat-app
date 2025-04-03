import { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

// Define the notification context type
interface NotificationContextType {
	addNotification: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
	removeNotification: (id: number) => void;
}

// Create the notification context with an initial value of undefined
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * The NotificationProvider component provides the notification functions to its children.
 *
 * @returns The NotificationProvider component
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
	const [notifications, setNotifications] = useState<{ id: number; type: 'success' | 'error' | 'info'; message: string }[]>([]);

	// Add a notification
	const addNotification = (type: 'success' | 'error' | 'info', message: string, duration: number = 5000) => {
		const id = Date.now() + Math.floor(Math.random() * 1000);

		setNotifications((prev) => [...prev, { id, type, message }]);

		// Remove notification after duration
		setTimeout(() => {
			setNotifications((prev) => prev.filter((notif) => notif.id !== id));
		}, duration);
	};

	// Remove a notification manually
	const removeNotification = (id: number) => {
		setNotifications((prev) => prev.filter((notif) => notif.id !== id));
	};

	return (
		<NotificationContext.Provider value={{ addNotification, removeNotification }}>
			{children}
			<NotificationContainer notifications={notifications} />
		</NotificationContext.Provider>
	);
}

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

function NotificationContainer({ notifications }: { notifications: { id: number; type: 'success' | 'error' | 'info'; message: string }[] }) {
	return (
		<div className="pointer-events-none fixed top-0 left-0 z-50 mt-4 flex w-full flex-col items-center space-y-2 px-4">
			{notifications.map((notif) => (
				<Notification key={notif.id} id={notif.id} type={notif.type} message={notif.message} />
			))}
		</div>
	);
}

// Notification Component
function Notification({ id, type, message }: { id: number; type: 'success' | 'error' | 'info'; message: string }) {
	const { removeNotification } = useNotification()!;
	const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-300';
	const textColor = type === 'success' || type === 'info' ? 'text-slate-950' : 'text-slate-50';
	const buttonHoverTextColor = type === 'success' || type === 'info' ? 'hover:text-slate-50' : 'hover:text-slate-950';

	return (
		<div className={`w-full max-w-3xl rounded-md shadow-lg ${bgColor} flex items-center p-2 ${textColor} pointer-events-auto`}>
			<div className="flex-grow text-center">
				<span className="text-lg font-semibold break-words whitespace-normal">{message}</span>
			</div>

			<button onClick={() => removeNotification(id)} className={`ml-2 px-2 py-1 text-xl transition ${textColor} ${buttonHoverTextColor}`}>
				<X className="h-7 w-7" />
			</button>
		</div>
	);
}
