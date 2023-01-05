// vite.config.ts
import { join as join2 } from "path";
import { defineConfig } from "file:///Users/TylorSteinberger/code/tylors/typed-fp/node_modules/.pnpm/vite@4.0.4_@types+node@18.11.18/node_modules/vite/dist/node/index.js";
import compression from "file:///Users/TylorSteinberger/code/tylors/typed-fp/node_modules/.pnpm/vite-plugin-compression@0.5.1_vite@4.0.4/node_modules/vite-plugin-compression/dist/index.mjs";

// packages/vite-plugin/src/vite-plugin.ts
import { existsSync } from "fs";
import { join, resolve } from "path";
import { setupTsProject, scanSourceFiles, buildEntryPoint } from "file:///Users/TylorSteinberger/code/tylors/typed-fp/packages/compiler/dist/index.js";
import { ts } from "file:///Users/TylorSteinberger/code/tylors/typed-fp/node_modules/.pnpm/ts-morph@17.0.1/node_modules/ts-morph/dist/ts-morph.js";
import { default as vavite } from "file:///Users/TylorSteinberger/code/tylors/typed-fp/node_modules/.pnpm/vavite@1.5.2_vite@4.0.4/node_modules/vavite/dist/index.mjs";
import tsconfigPaths from "file:///Users/TylorSteinberger/code/tylors/typed-fp/node_modules/.pnpm/vite-tsconfig-paths@4.0.3_vite@4.0.4/node_modules/vite-tsconfig-paths/dist/index.mjs";
var cwd = process.cwd();
var PLUGIN_NAME = "@typed/vite-plugin";
var BROWSER_VIRTUAL_ENTRYPOINT = "virtual:browser-entry";
var SERVER_VIRTUAL_ENTRYPOINT = "virtual:server-entry";
function makePlugin({ directory, tsConfig, pages }) {
  const sourceDirectory = resolve(cwd, directory);
  const tsConfigFilePath = resolve(sourceDirectory, tsConfig);
  console.info(`[${PLUGIN_NAME}]: Setting up typescript project...`);
  const project = setupTsProject(tsConfigFilePath);
  const BROWSER_VIRTUAL_ID = "\0" + join(sourceDirectory, "browser.ts");
  const SERVER_VIRTUAL_ID = "\0" + join(sourceDirectory, "server.ts");
  const indexHtmlFilePath = join(sourceDirectory, "index.html");
  if (!existsSync(indexHtmlFilePath)) {
    throw new Error(`[${PLUGIN_NAME}]: Could not find index.html file at ${indexHtmlFilePath}`);
  }
  const serverFilePath = join(sourceDirectory, "server.ts");
  const serverExists = existsSync(serverFilePath);
  return {
    name: PLUGIN_NAME,
    config(config) {
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.push(
        tsconfigPaths({
          projects: [tsConfigFilePath]
        }),
        ...serverExists ? [
          vavite({
            serverEntry: serverFilePath,
            serveClientAssetsInDev: true
          })
        ] : []
      );
      if (serverExists && !config.buildSteps) {
        ;
        config.buildSteps = [
          {
            name: "client",
            config: {
              build: {
                outDir: "dist/client",
                rollupOptions: { input: resolve(sourceDirectory, "index.html") }
              }
            }
          },
          {
            name: "server",
            config: {
              build: {
                ssr: true,
                outDir: "dist/server",
                rollupOptions: { input: serverFilePath }
              }
            }
          }
        ];
      }
    },
    async resolveId(id, importer) {
      if (id === BROWSER_VIRTUAL_ENTRYPOINT) {
        return BROWSER_VIRTUAL_ID;
      }
      if (id === SERVER_VIRTUAL_ENTRYPOINT) {
        return SERVER_VIRTUAL_ID;
      }
      if (importer === BROWSER_VIRTUAL_ID || importer === SERVER_VIRTUAL_ID) {
        if (id.startsWith(".")) {
          const tsPath = resolve(sourceDirectory, id.replace(/.js(x)?$/, ".ts$1"));
          if (existsSync(tsPath)) {
            return tsPath;
          }
          const jsPath = resolve(sourceDirectory, id);
          if (existsSync(jsPath)) {
            return tsPath;
          }
        }
      }
    },
    load(id) {
      if (id === BROWSER_VIRTUAL_ID) {
        return scanAndBuild(sourceDirectory, pages, project, "browser");
      }
      if (id === SERVER_VIRTUAL_ID) {
        return scanAndBuild(sourceDirectory, pages, project, "server");
      }
    }
  };
}
function scanAndBuild(dir, pages, project, environment) {
  const scanned = scanSourceFiles(
    pages.map((x) => join(dir, x)),
    project
  );
  const filePath = join(dir, `${environment}.ts`);
  const entryPoint = buildEntryPoint(scanned, project, environment, filePath);
  const output = ts.transpileModule(entryPoint.getFullText(), {
    fileName: entryPoint.getFilePath(),
    compilerOptions: project.getCompilerOptions()
  });
  return {
    code: output.outputText,
    map: output.sourceMapText
  };
}

// vite.config.ts
var __vite_injected_original_dirname = "/Users/TylorSteinberger/code/tylors/typed-fp";
var vite_config_default = defineConfig({
  plugins: [
    makePlugin({
      directory: join2(__vite_injected_original_dirname, "example"),
      pages: ["pages/**/*"],
      tsConfig: "tsconfig.json"
    }),
    compression()
  ],
  build: {
    manifest: true,
    sourcemap: true,
    minify: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZXMvdml0ZS1wbHVnaW4vc3JjL3ZpdGUtcGx1Z2luLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL1R5bG9yU3RlaW5iZXJnZXIvY29kZS90eWxvcnMvdHlwZWQtZnBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9UeWxvclN0ZWluYmVyZ2VyL2NvZGUvdHlsb3JzL3R5cGVkLWZwL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9UeWxvclN0ZWluYmVyZ2VyL2NvZGUvdHlsb3JzL3R5cGVkLWZwL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2YXZpdGUvdml0ZS1jb25maWdcIiAvPlxuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCdcblxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbidcblxuaW1wb3J0IHR5cGVkIGZyb20gJy4vcGFja2FnZXMvdml0ZS1wbHVnaW4vc3JjL3ZpdGUtcGx1Z2luJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdHlwZWQoe1xuICAgICAgLy8gRGlyZWN0b3J5IHNob3VsZCBwb2ludCB0b3dhcmRzIHRoZSByb290IG9mIHlvdXIgcHJvamVjdCB3aXRoIGFuIGluZGV4Lmh0bWwgZmlsZVxuICAgICAgZGlyZWN0b3J5OiBqb2luKF9fZGlybmFtZSwgJ2V4YW1wbGUnKSxcbiAgICAgIC8vIEdsb2JzIHRvIHNlYXJjaCBmb3Igcm91dGVzIGFuZCByZW5kZXJhYmxlcy4gQ2FuIGJlIGFic29sdXRlIHBhdGggb3IgcmVsYXRpdmUgdG8gZGlyZWN0b3J5IGFib3ZlXG4gICAgICBwYWdlczogWydwYWdlcy8qKi8qJ10sXG4gICAgICAvLyBQYXRoIHRvIHlvdXIgdHNjb25maWcuanNvbiBmaWxlLiBDYW4gYmUgYWJzb2x1dGUgcGF0aCBvciByZWxhdGl2ZSB0byBkaXJlY3RvcnkgYWJvdmVcbiAgICAgIHRzQ29uZmlnOiAndHNjb25maWcuanNvbicsXG4gICAgfSksXG4gICAgY29tcHJlc3Npb24oKSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBtYW5pZmVzdDogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgbWluaWZ5OiB0cnVlLFxuICB9LFxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL1R5bG9yU3RlaW5iZXJnZXIvY29kZS90eWxvcnMvdHlwZWQtZnAvcGFja2FnZXMvdml0ZS1wbHVnaW4vc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvVHlsb3JTdGVpbmJlcmdlci9jb2RlL3R5bG9ycy90eXBlZC1mcC9wYWNrYWdlcy92aXRlLXBsdWdpbi9zcmMvdml0ZS1wbHVnaW4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL1R5bG9yU3RlaW5iZXJnZXIvY29kZS90eWxvcnMvdHlwZWQtZnAvcGFja2FnZXMvdml0ZS1wbHVnaW4vc3JjL3ZpdGUtcGx1Z2luLnRzXCI7aW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ2ZzJ1xuaW1wb3J0IHsgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwidmF2aXRlL3ZpdGUtY29uZmlnXCIgLz5cblxuaW1wb3J0IHsgc2V0dXBUc1Byb2plY3QsIHNjYW5Tb3VyY2VGaWxlcywgYnVpbGRFbnRyeVBvaW50IH0gZnJvbSAnQHR5cGVkL2NvbXBpbGVyJ1xuaW1wb3J0IHsgRW52aXJvbm1lbnQgfSBmcm9tICdAdHlwZWQvaHRtbCdcbmltcG9ydCB7IFByb2plY3QsIHRzIH0gZnJvbSAndHMtbW9ycGgnXG4vLyBAdHMtZXhwZWN0LWVycm9yIFR5cGVzIGRvbid0IHNlZW0gdG8gd29yayB3aXRoIEVTTmV4dCBtb2R1bGUgcmVzb2x1dGlvblxuaW1wb3J0IHsgZGVmYXVsdCBhcyB2YXZpdGUgfSBmcm9tICd2YXZpdGUnXG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocydcblxuZXhwb3J0IGludGVyZmFjZSBQbHVnaW5PcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBkaXJlY3RvcnkgaW4gd2hpY2ggeW91IGhhdmUgeW91ciBlbnRyeSBmaWxlcy4gTmFtZWx5IGFuIGluZGV4Lmh0bWwgZmlsZSBhbmQgb3B0aW9uYWxseSBhIHNlcnZlci50cyBmaWxlXG4gICAqL1xuICByZWFkb25seSBkaXJlY3Rvcnk6IHN0cmluZ1xuICAvKipcbiAgICogVGhlIG5hbWUvcGF0aCB0byB5b3VyIHRzY29uZmlnLmpzb24gZmlsZSwgcmVsYXRpdmUgdG8gdGhlIGRpcmVjdG9yeSBhYm92ZSBvciBhYnNvbHV0ZVxuICAgKi9cbiAgcmVhZG9ubHkgdHNDb25maWc6IHN0cmluZ1xuICAvKipcbiAgICogRmlsZSBnbG9icyB0byBzY2FuIGZvciBwYWdlcywgcmVsYXRpdmUgdG8gdGhlIGRpcmVjdG9yeSBhYm92ZSBvciBhYnNvbHV0ZVxuICAgKi9cbiAgcmVhZG9ubHkgcGFnZXM6IHJlYWRvbmx5IHN0cmluZ1tdXG59XG5cbmNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcblxuY29uc3QgUExVR0lOX05BTUUgPSAnQHR5cGVkL3ZpdGUtcGx1Z2luJ1xuY29uc3QgQlJPV1NFUl9WSVJUVUFMX0VOVFJZUE9JTlQgPSAndmlydHVhbDpicm93c2VyLWVudHJ5J1xuY29uc3QgU0VSVkVSX1ZJUlRVQUxfRU5UUllQT0lOVCA9ICd2aXJ0dWFsOnNlcnZlci1lbnRyeSdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWFrZVBsdWdpbih7IGRpcmVjdG9yeSwgdHNDb25maWcsIHBhZ2VzIH06IFBsdWdpbk9wdGlvbnMpOiBQbHVnaW4ge1xuICBjb25zdCBzb3VyY2VEaXJlY3RvcnkgPSByZXNvbHZlKGN3ZCwgZGlyZWN0b3J5KVxuICBjb25zdCB0c0NvbmZpZ0ZpbGVQYXRoID0gcmVzb2x2ZShzb3VyY2VEaXJlY3RvcnksIHRzQ29uZmlnKVxuXG4gIGNvbnNvbGUuaW5mbyhgWyR7UExVR0lOX05BTUV9XTogU2V0dGluZyB1cCB0eXBlc2NyaXB0IHByb2plY3QuLi5gKVxuICBjb25zdCBwcm9qZWN0ID0gc2V0dXBUc1Byb2plY3QodHNDb25maWdGaWxlUGF0aClcblxuICBjb25zdCBCUk9XU0VSX1ZJUlRVQUxfSUQgPSAnXFwwJyArIGpvaW4oc291cmNlRGlyZWN0b3J5LCAnYnJvd3Nlci50cycpXG4gIGNvbnN0IFNFUlZFUl9WSVJUVUFMX0lEID0gJ1xcMCcgKyBqb2luKHNvdXJjZURpcmVjdG9yeSwgJ3NlcnZlci50cycpXG5cbiAgY29uc3QgaW5kZXhIdG1sRmlsZVBhdGggPSBqb2luKHNvdXJjZURpcmVjdG9yeSwgJ2luZGV4Lmh0bWwnKVxuXG4gIGlmICghZXhpc3RzU3luYyhpbmRleEh0bWxGaWxlUGF0aCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFske1BMVUdJTl9OQU1FfV06IENvdWxkIG5vdCBmaW5kIGluZGV4Lmh0bWwgZmlsZSBhdCAke2luZGV4SHRtbEZpbGVQYXRofWApXG4gIH1cblxuICBjb25zdCBzZXJ2ZXJGaWxlUGF0aCA9IGpvaW4oc291cmNlRGlyZWN0b3J5LCAnc2VydmVyLnRzJylcbiAgY29uc3Qgc2VydmVyRXhpc3RzID0gZXhpc3RzU3luYyhzZXJ2ZXJGaWxlUGF0aClcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IFBMVUdJTl9OQU1FLFxuICAgIGNvbmZpZyhjb25maWcpIHtcbiAgICAgIGlmICghY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgY29uZmlnLnBsdWdpbnMgPSBbXVxuICAgICAgfVxuXG4gICAgICBjb25maWcucGx1Z2lucy5wdXNoKFxuICAgICAgICB0c2NvbmZpZ1BhdGhzKHtcbiAgICAgICAgICBwcm9qZWN0czogW3RzQ29uZmlnRmlsZVBhdGhdLFxuICAgICAgICB9KSxcbiAgICAgICAgLi4uKHNlcnZlckV4aXN0c1xuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICB2YXZpdGUoe1xuICAgICAgICAgICAgICAgIHNlcnZlckVudHJ5OiBzZXJ2ZXJGaWxlUGF0aCxcbiAgICAgICAgICAgICAgICBzZXJ2ZUNsaWVudEFzc2V0c0luRGV2OiB0cnVlLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICA6IFtdKSxcbiAgICAgIClcblxuICAgICAgLy8gU2V0dXAgdmF2aXRlIG11bHRpLWJ1aWxkXG5cbiAgICAgIGlmIChzZXJ2ZXJFeGlzdHMgJiYgIShjb25maWcgYXMgYW55KS5idWlsZFN0ZXBzKSB7XG4gICAgICAgIDsoY29uZmlnIGFzIGFueSkuYnVpbGRTdGVwcyA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnY2xpZW50JyxcbiAgICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgICAgIG91dERpcjogJ2Rpc3QvY2xpZW50JyxcbiAgICAgICAgICAgICAgICByb2xsdXBPcHRpb25zOiB7IGlucHV0OiByZXNvbHZlKHNvdXJjZURpcmVjdG9yeSwgJ2luZGV4Lmh0bWwnKSB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdzZXJ2ZXInLFxuICAgICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICAgICAgc3NyOiB0cnVlLFxuICAgICAgICAgICAgICAgIG91dERpcjogJ2Rpc3Qvc2VydmVyJyxcbiAgICAgICAgICAgICAgICByb2xsdXBPcHRpb25zOiB7IGlucHV0OiBzZXJ2ZXJGaWxlUGF0aCB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHJlc29sdmVJZChpZCwgaW1wb3J0ZXIpIHtcbiAgICAgIGlmIChpZCA9PT0gQlJPV1NFUl9WSVJUVUFMX0VOVFJZUE9JTlQpIHtcbiAgICAgICAgcmV0dXJuIEJST1dTRVJfVklSVFVBTF9JRFxuICAgICAgfVxuXG4gICAgICBpZiAoaWQgPT09IFNFUlZFUl9WSVJUVUFMX0VOVFJZUE9JTlQpIHtcbiAgICAgICAgcmV0dXJuIFNFUlZFUl9WSVJUVUFMX0lEXG4gICAgICB9XG5cbiAgICAgIC8vIFZpcnR1YWwgbW9kdWxlcyBoYXZlIHByb2JsZW1zIHdpdGggcmVzb2x2aW5nIG1vZHVsZXMgZHVlIHRvIG5vdCBoYXZpbmcgYSByZWFsIGRpcmVjdG9yeSB0byB3b3JrIHdpdGhcbiAgICAgIC8vIHRodXMgdGhlIG5lZWQgdG8gcmVzb2x2ZSB0aGVtIG1hbnVhbGx5LlxuICAgICAgaWYgKGltcG9ydGVyID09PSBCUk9XU0VSX1ZJUlRVQUxfSUQgfHwgaW1wb3J0ZXIgPT09IFNFUlZFUl9WSVJUVUFMX0lEKSB7XG4gICAgICAgIC8vIElmIGEgcmVsYXRpdmUgcGF0aCwgYXR0ZW1wdCB0byBtYXRjaCB0byBhIHNvdXJjZSAudHMoeCkgZmlsZVxuICAgICAgICBpZiAoaWQuc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICAgICAgY29uc3QgdHNQYXRoID0gcmVzb2x2ZShzb3VyY2VEaXJlY3RvcnksIGlkLnJlcGxhY2UoLy5qcyh4KT8kLywgJy50cyQxJykpXG5cbiAgICAgICAgICBpZiAoZXhpc3RzU3luYyh0c1BhdGgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHNQYXRoXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QganNQYXRoID0gcmVzb2x2ZShzb3VyY2VEaXJlY3RvcnksIGlkKVxuXG4gICAgICAgICAgaWYgKGV4aXN0c1N5bmMoanNQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRzUGF0aFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IEJST1dTRVJfVklSVFVBTF9JRCkge1xuICAgICAgICByZXR1cm4gc2NhbkFuZEJ1aWxkKHNvdXJjZURpcmVjdG9yeSwgcGFnZXMsIHByb2plY3QsICdicm93c2VyJylcbiAgICAgIH1cblxuICAgICAgaWYgKGlkID09PSBTRVJWRVJfVklSVFVBTF9JRCkge1xuICAgICAgICByZXR1cm4gc2NhbkFuZEJ1aWxkKHNvdXJjZURpcmVjdG9yeSwgcGFnZXMsIHByb2plY3QsICdzZXJ2ZXInKVxuICAgICAgfVxuICAgIH0sXG4gIH1cbn1cblxuZnVuY3Rpb24gc2NhbkFuZEJ1aWxkKFxuICBkaXI6IHN0cmluZyxcbiAgcGFnZXM6IHJlYWRvbmx5IHN0cmluZ1tdLFxuICBwcm9qZWN0OiBQcm9qZWN0LFxuICBlbnZpcm9ubWVudDogRW52aXJvbm1lbnQsXG4pIHtcbiAgY29uc3Qgc2Nhbm5lZCA9IHNjYW5Tb3VyY2VGaWxlcyhcbiAgICBwYWdlcy5tYXAoKHgpID0+IGpvaW4oZGlyLCB4KSksXG4gICAgcHJvamVjdCxcbiAgKVxuICBjb25zdCBmaWxlUGF0aCA9IGpvaW4oZGlyLCBgJHtlbnZpcm9ubWVudH0udHNgKVxuICBjb25zdCBlbnRyeVBvaW50ID0gYnVpbGRFbnRyeVBvaW50KHNjYW5uZWQsIHByb2plY3QsIGVudmlyb25tZW50LCBmaWxlUGF0aClcbiAgY29uc3Qgb3V0cHV0ID0gdHMudHJhbnNwaWxlTW9kdWxlKGVudHJ5UG9pbnQuZ2V0RnVsbFRleHQoKSwge1xuICAgIGZpbGVOYW1lOiBlbnRyeVBvaW50LmdldEZpbGVQYXRoKCksXG4gICAgY29tcGlsZXJPcHRpb25zOiBwcm9qZWN0LmdldENvbXBpbGVyT3B0aW9ucygpLFxuICB9KVxuXG4gIHJldHVybiB7XG4gICAgY29kZTogb3V0cHV0Lm91dHB1dFRleHQsXG4gICAgbWFwOiBvdXRwdXQuc291cmNlTWFwVGV4dCxcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsUUFBQUEsYUFBWTtBQUVyQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLGlCQUFpQjs7O0FDTHlXLFNBQVMsa0JBQWtCO0FBQzVaLFNBQVMsTUFBTSxlQUFlO0FBSTlCLFNBQVMsZ0JBQWdCLGlCQUFpQix1QkFBdUI7QUFFakUsU0FBa0IsVUFBVTtBQUU1QixTQUFTLFdBQVcsY0FBYztBQUVsQyxPQUFPLG1CQUFtQjtBQWlCMUIsSUFBTSxNQUFNLFFBQVEsSUFBSTtBQUV4QixJQUFNLGNBQWM7QUFDcEIsSUFBTSw2QkFBNkI7QUFDbkMsSUFBTSw0QkFBNEI7QUFFbkIsU0FBUixXQUE0QixFQUFFLFdBQVcsVUFBVSxNQUFNLEdBQTBCO0FBQ3hGLFFBQU0sa0JBQWtCLFFBQVEsS0FBSyxTQUFTO0FBQzlDLFFBQU0sbUJBQW1CLFFBQVEsaUJBQWlCLFFBQVE7QUFFMUQsVUFBUSxLQUFLLElBQUksZ0RBQWdEO0FBQ2pFLFFBQU0sVUFBVSxlQUFlLGdCQUFnQjtBQUUvQyxRQUFNLHFCQUFxQixPQUFPLEtBQUssaUJBQWlCLFlBQVk7QUFDcEUsUUFBTSxvQkFBb0IsT0FBTyxLQUFLLGlCQUFpQixXQUFXO0FBRWxFLFFBQU0sb0JBQW9CLEtBQUssaUJBQWlCLFlBQVk7QUFFNUQsTUFBSSxDQUFDLFdBQVcsaUJBQWlCLEdBQUc7QUFDbEMsVUFBTSxJQUFJLE1BQU0sSUFBSSxtREFBbUQsbUJBQW1CO0FBQUEsRUFDNUY7QUFFQSxRQUFNLGlCQUFpQixLQUFLLGlCQUFpQixXQUFXO0FBQ3hELFFBQU0sZUFBZSxXQUFXLGNBQWM7QUFFOUMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sT0FBTyxRQUFRO0FBQ2IsVUFBSSxDQUFDLE9BQU8sU0FBUztBQUNuQixlQUFPLFVBQVUsQ0FBQztBQUFBLE1BQ3BCO0FBRUEsYUFBTyxRQUFRO0FBQUEsUUFDYixjQUFjO0FBQUEsVUFDWixVQUFVLENBQUMsZ0JBQWdCO0FBQUEsUUFDN0IsQ0FBQztBQUFBLFFBQ0QsR0FBSSxlQUNBO0FBQUEsVUFDRSxPQUFPO0FBQUEsWUFDTCxhQUFhO0FBQUEsWUFDYix3QkFBd0I7QUFBQSxVQUMxQixDQUFDO0FBQUEsUUFDSCxJQUNBLENBQUM7QUFBQSxNQUNQO0FBSUEsVUFBSSxnQkFBZ0IsQ0FBRSxPQUFlLFlBQVk7QUFDL0M7QUFBQyxRQUFDLE9BQWUsYUFBYTtBQUFBLFVBQzVCO0FBQUEsWUFDRSxNQUFNO0FBQUEsWUFDTixRQUFRO0FBQUEsY0FDTixPQUFPO0FBQUEsZ0JBQ0wsUUFBUTtBQUFBLGdCQUNSLGVBQWUsRUFBRSxPQUFPLFFBQVEsaUJBQWlCLFlBQVksRUFBRTtBQUFBLGNBQ2pFO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsWUFDRSxNQUFNO0FBQUEsWUFDTixRQUFRO0FBQUEsY0FDTixPQUFPO0FBQUEsZ0JBQ0wsS0FBSztBQUFBLGdCQUNMLFFBQVE7QUFBQSxnQkFDUixlQUFlLEVBQUUsT0FBTyxlQUFlO0FBQUEsY0FDekM7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBRUEsTUFBTSxVQUFVLElBQUksVUFBVTtBQUM1QixVQUFJLE9BQU8sNEJBQTRCO0FBQ3JDLGVBQU87QUFBQSxNQUNUO0FBRUEsVUFBSSxPQUFPLDJCQUEyQjtBQUNwQyxlQUFPO0FBQUEsTUFDVDtBQUlBLFVBQUksYUFBYSxzQkFBc0IsYUFBYSxtQkFBbUI7QUFFckUsWUFBSSxHQUFHLFdBQVcsR0FBRyxHQUFHO0FBQ3RCLGdCQUFNLFNBQVMsUUFBUSxpQkFBaUIsR0FBRyxRQUFRLFlBQVksT0FBTyxDQUFDO0FBRXZFLGNBQUksV0FBVyxNQUFNLEdBQUc7QUFDdEIsbUJBQU87QUFBQSxVQUNUO0FBRUEsZ0JBQU0sU0FBUyxRQUFRLGlCQUFpQixFQUFFO0FBRTFDLGNBQUksV0FBVyxNQUFNLEdBQUc7QUFDdEIsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxLQUFLLElBQUk7QUFDUCxVQUFJLE9BQU8sb0JBQW9CO0FBQzdCLGVBQU8sYUFBYSxpQkFBaUIsT0FBTyxTQUFTLFNBQVM7QUFBQSxNQUNoRTtBQUVBLFVBQUksT0FBTyxtQkFBbUI7QUFDNUIsZUFBTyxhQUFhLGlCQUFpQixPQUFPLFNBQVMsUUFBUTtBQUFBLE1BQy9EO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjtBQUVBLFNBQVMsYUFDUCxLQUNBLE9BQ0EsU0FDQSxhQUNBO0FBQ0EsUUFBTSxVQUFVO0FBQUEsSUFDZCxNQUFNLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUM7QUFBQSxJQUM3QjtBQUFBLEVBQ0Y7QUFDQSxRQUFNLFdBQVcsS0FBSyxLQUFLLEdBQUcsZ0JBQWdCO0FBQzlDLFFBQU0sYUFBYSxnQkFBZ0IsU0FBUyxTQUFTLGFBQWEsUUFBUTtBQUMxRSxRQUFNLFNBQVMsR0FBRyxnQkFBZ0IsV0FBVyxZQUFZLEdBQUc7QUFBQSxJQUMxRCxVQUFVLFdBQVcsWUFBWTtBQUFBLElBQ2pDLGlCQUFpQixRQUFRLG1CQUFtQjtBQUFBLEVBQzlDLENBQUM7QUFFRCxTQUFPO0FBQUEsSUFDTCxNQUFNLE9BQU87QUFBQSxJQUNiLEtBQUssT0FBTztBQUFBLEVBQ2Q7QUFDRjs7O0FEbktBLElBQU0sbUNBQW1DO0FBU3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLFdBQU07QUFBQSxNQUVKLFdBQVdDLE1BQUssa0NBQVcsU0FBUztBQUFBLE1BRXBDLE9BQU8sQ0FBQyxZQUFZO0FBQUEsTUFFcEIsVUFBVTtBQUFBLElBQ1osQ0FBQztBQUFBLElBQ0QsWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFVBQVU7QUFBQSxJQUNWLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxFQUNWO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsiam9pbiIsICJqb2luIl0KfQo=
