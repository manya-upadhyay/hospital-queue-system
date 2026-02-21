const logger = require('./utils/logger');

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Patient joins their queue room to receive updates
    socket.on('join-queue', ({ queueId }) => {
      socket.join(`queue-${queueId}`);
      logger.debug(`Patient joined queue room: queue-${queueId}`);
    });

    // Doctor joins their queue room
    socket.on('join-doctor-room', ({ doctorId }) => {
      socket.join(`doctor-${doctorId}`);
      logger.debug(`Doctor joined room: doctor-${doctorId}`);
    });

    // Admin joins global room
    socket.on('join-admin', () => {
      socket.join('admin-room');
    });

    // Doctor broadcasts their status change
    socket.on('doctor-status-change', ({ doctorId, isAvailable }) => {
      io.emit('doctor-availability-changed', { doctorId, isAvailable });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocketHandlers };
