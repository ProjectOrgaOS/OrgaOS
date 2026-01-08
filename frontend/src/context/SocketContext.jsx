import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create context to share socket across components
const SocketContext = createContext(null);

// Helper to extract userId from JWT token
function getUserIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // JWT tokens are base64 encoded: header.payload.signature
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.userId;
  } catch {
    return null;
  }
}

// Provider component that creates and manages the socket connection
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to our backend Socket.io server
    const newSocket = io('http://localhost:3000');

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server:', newSocket.id);

      // Register user ID with socket for targeted events
      const userId = getUserIdFromToken();
      if (userId) {
        newSocket.emit('register', userId);
      }
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
