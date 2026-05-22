import app from "./app";
import { adms } from "./adms";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "API server listening");
});

// ADMS server for ZKTeco biometric devices
const admsPort = Number(process.env["ADMS_PORT"] ?? 8082);
adms.listen(admsPort, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error starting ADMS server");
    return;
  }
  logger.info({ admsPort }, "ADMS server listening (ZK biometric devices)");
});
