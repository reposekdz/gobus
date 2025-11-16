import { Server } from 'socket.io';
import logger from './utils/logger';

export const initSocket = (io: Server) => {
    io.on('connection', (socket) => {
        logger.info(`Client connected: ${socket.id}`);
        
        socket.on('join-room', (room) => {
            socket.join(room);
            logger.info(`Client ${socket.id} joined room: ${room}`);
        });
        
        socket.on('leave-room', (room) => {
            socket.leave(room);
            logger.info(`Client ${socket.id} left room: ${room}`);
        });
        
        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });
};