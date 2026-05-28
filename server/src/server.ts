import http from 'http';
import { env } from './config/env';
import connectDB from './config/db';
import { initSocket } from './socket/socket';
import app from './app';

const bootstrap = async (): Promise<void> => {
  await connectDB();

  const httpServer = http.createServer(app);

  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log('Server running in ' + env.NODE_ENV + ' mode on port ' + env.PORT);
  });
};

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
