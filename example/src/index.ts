import { initOrm, closeGlobalOrmConnection } from "./orm";

(async function bootstrap() {
  try {
    await initOrm();
    console.log("Started!");
  } catch (e) {
    console.log("Got error while initializing", e);
  } finally {
    closeGlobalOrmConnection();
    console.log("Ended!");
  }
})();
