import 'dotenv/config';
import { createApp } from './app.js';

const { app, env } = createApp();

const host = process.env.HOST ?? '0.0.0.0';

app.listen(env.PORT, host, () => {
  console.log(
    `Servidor em http://${host}:${env.PORT} (${env.NODE_ENV}) — use HOST=127.0.0.1 só atrás de proxy local.`
  );
});
