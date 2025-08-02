import { defineConfig } from "vite";

import { assetsPlugin } from "./scripts/vite-plugin-assets";

// https://vite.dev/config/
export default defineConfig({
    plugins: [assetsPlugin()],
    server: {
        port: 8080,
        open: false,
    },
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
});
