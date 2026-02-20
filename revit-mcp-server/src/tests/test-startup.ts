/**
 * Quick smoke test for MCP server startup.
 * Verifies the server can initialize and register all tools without errors.
 *
 * Usage: node build/tests/test-startup.js
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../tools/register.js";

async function main() {
    console.log("\n🧪 MCP Server Startup Test\n");

    try {
        // Create server
        const server = new McpServer({
            name: "revit-mcp-test",
            version: "1.0.0",
        });
        console.log("  ✓ Server instance created");

        // Register tools
        await registerTools(server);
        console.log("  ✓ Tool registration complete");

        console.log("\n  All checks passed ✓\n");
        process.exit(0);
    } catch (error) {
        console.error("  ✗ Startup failed:", error);
        process.exit(1);
    }
}

main();
