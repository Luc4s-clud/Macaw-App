import 'dotenv/config';
import { createApp } from './app.js';

const { app, env } = createApp();

app.listen(env.PORT, () => {
  console.log(`Servidor rodando em http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
