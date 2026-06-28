import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Determine backend URL
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket.IO connected to backend');
      
      // Join room for real-time updates
      socketInstance.emit('join_user_room', user.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket.IO disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
