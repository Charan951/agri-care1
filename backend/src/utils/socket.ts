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
    socket.on('join_user_room', (userId: string, role?: string) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room user_${userId}`);
      if (role) {
        socket.join(`role_${role}`);
        console.log(`Socket ${socket.id} joined room role_${role}`);
        if (role === 'SUPER_USER' || role === 'ADMIN') {
          socket.join('role_ADMIN');
          console.log(`Socket ${socket.id} joined room role_ADMIN`);
        }
      }
    });

    // WebRTC voice calling signaling
    socket.on('call_user', (data: { toUserId: string, offer: any, consultationId: string, callerName: string }) => {
      io?.to(`user_${data.toUserId}`).emit('call_incoming', {
        offer: data.offer,
        consultationId: data.consultationId,
        callerName: data.callerName
      });
    });

    socket.on('answer_call', (data: { toUserId: string, answer: any, consultationId: string }) => {
      io?.to(`user_${data.toUserId}`).emit('call_answered', {
        answer: data.answer,
        consultationId: data.consultationId
      });
    });

    socket.on('ice_candidate', (data: { toUserId: string, candidate: any, consultationId: string }) => {
      io?.to(`user_${data.toUserId}`).emit('ice_candidate', {
        candidate: data.candidate,
        consultationId: data.consultationId
      });
    });

    socket.on('end_call', (data: { toUserId: string, consultationId: string }) => {
      io?.to(`user_${data.toUserId}`).emit('call_ended', {
        consultationId: data.consultationId
      });
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
