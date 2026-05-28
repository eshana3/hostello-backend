import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './socket/socket';
import app from './app';

const bootstrap = async (): Promise<void> => {
  await connectDB();

  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  initSocket(io);

  httpServer.listen(env.PORT, () => {
    console.log('Server running in ' + env.NODE_ENV + ' mode on port ' + env.PORT);
  });
};

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
