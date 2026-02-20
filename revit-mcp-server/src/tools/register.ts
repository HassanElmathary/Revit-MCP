import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export async function registerTools(server: McpServer) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const files = fs.readdirSync(__dirname);
    const toolFiles = files.filter(
        (file) =>
            (file.endsWith(".ts") || file.endsWith(".js")) &&
            !file.endsWith(".d.ts") &&
            !file.endsWith(".d.js") &&
            file !== "register.ts" &&
            file !== "register.js"
    );

    let registered = 0;
    for (const file of toolFiles) {
        try {
            const importPath = `./${file.replace(/\.(ts|js)$/, ".js")}`;
            const module = await import(importPath);

            const registerFn = Object.keys(module).find(
                (key) => key.startsWith("register") && typeof module[key] === "function"
            );

            if (registerFn) {
                module[registerFn](server);
                registered++;
                console.error(`  ✓ Registered tool: ${file.replace(/\.(ts|js)$/, "")}`);
            }
        } catch (error) {
            console.error(`  ✗ Failed to register ${file}:`, error);
        }
    }
    console.error(`Total tools registered: ${registered}`);
}
