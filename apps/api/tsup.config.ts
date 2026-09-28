import { defineConfig } from "tsup";

// Bundle the workspace packages (TypeScript sources) into the output; keep npm deps external.
export default defineConfig({
  entry: ["src/server.ts", "src/migrate.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  noExternal: [/^@qdot\//],
});
