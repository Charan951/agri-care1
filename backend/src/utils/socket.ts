import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer, allowedOrigins: string[]) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Farmers and specialists will join their own user-specific room
    socket.on('join_user_room', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data);
    console.log(`Socket emitted ${event} to room ${room}`);
  } else {
    console.warn(`Socket.io not initialized. Cannot emit ${event} to room ${room}`);
  }
};
