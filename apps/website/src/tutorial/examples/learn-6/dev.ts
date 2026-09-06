import { createServer } from "node:http";
import { createServer as createViteServer } from "vite";

const vite = await createViteServer({
  appType: "custom",
  server: { middlewareMode: true },
});
const server = createServer((request, response) => {
  vite.middlewares(request, response, async () => {
    if (request.url !== "/") {
      response.writeHead(404).end("Not found");
      return;
    }
    try {
      const { markup } = await vite.ssrLoadModule("/src/server.ts");
      const document = await vite.transformIndexHtml("/", markup);
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(document);
    } catch (error) {
      console.error(error);
      response.writeHead(500).end("The server render failed; see the terminal.");
    }
  });
});
server.listen(5174, "127.0.0.1", () => console.log("Counter: http://127.0.0.1:5174"));
process.once("SIGINT", () => {
  server.close();
  void vite.close();
});
