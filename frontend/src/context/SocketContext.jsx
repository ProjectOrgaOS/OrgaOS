import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create context to share socket across components
const SocketContext = createContext(null);

// Provider component that creates and manages the socket connection
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to our backend Socket.io server
    const newSocket = io('http://localhost:3000');

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });

    setSocket(newSocket);

    // Cleanup: disconnect when component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook for easy access to socket in any component
export function useSocket() {
  return useContext(SocketContext);
}
