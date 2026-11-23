import { createDb } from './db/client.ts';
import { createApp } from './app.ts';
import { loadConfig } from './config.ts';

const config = loadConfig();
const { db } = createDb(config.databaseUrl);

createApp({ db, webDir: config.webDir }).listen(config.port, () => {
  console.log(`EpiQuest server listening on http://localhost:${config.port}`);
});
