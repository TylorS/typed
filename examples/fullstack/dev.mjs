import { createServer } from "vite";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { port: { type: "string" } } });
const port = values.port === undefined ? 3000 : Number(values.port);

const vite = await createServer({
  root: import.meta.dirname,
  appType: "custom",
  server: {
    middlewareMode: true,
    preTransformRequests: false,
  },
});
const { runServer } = await vite.ssrLoadModule("/src/server.ts");

runServer({ port, vite });
