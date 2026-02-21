import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }
  return socket;
};

export const getSocket = () => socket;

export const joinQueueRoom = (queueId) => {
  if (socket) socket.emit('join-queue', { queueId });
};

export const joinDoctorRoom = (doctorId) => {
  if (socket) socket.emit('join-doctor-room', { doctorId });
};

export const joinAdminRoom = () => {
  if (socket) socket.emit('join-admin');
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
