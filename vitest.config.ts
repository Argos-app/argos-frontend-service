import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
	test: {
		include: ["tests/**/*.integration.test.tsx", "tests/**/*.service.test.ts"],
		environment: "jsdom",
		clearMocks: true,
	},
});
