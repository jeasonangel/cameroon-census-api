import { buildApp } from './app';
import { config } from './config';

const app = buildApp();

app.listen(config.port, () => {
  console.log(`Cameroon Census API listening on :${config.port} [${config.nodeEnv}]`);
});
