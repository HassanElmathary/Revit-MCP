import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withRevitConnection } from "../utils/ConnectionManager.js";

/**
 * Advanced Tools — Code execution, AI filter, and model reset
 */
export function registerAdvancedTools(server: McpServer) {

    // 1. Send code to Revit
    server.tool(
        "send_code_to_revit",
        "Send C# code to execute directly in Revit. The code runs in the context of the Revit API with access to the current Document and UIApplication. Use for advanced operations not covered by other tools.",
        {
            code: z.string().describe("C# code to execute in Revit. Has access to: UIApplication uiApp, Document doc, and all Revit API namespaces."),
            description: z.string().optional().describe("Human-readable description of what the code does"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("send_code_to_revit", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 2. AI element filter
    server.tool(
        "ai_element_filter",
        "Use AI-powered natural language to filter elements. Describe what you want to find and the system will translate it to Revit filters.",
        {
            query: z.string().describe("Natural language description of elements to find, e.g. 'all exterior walls taller than 10 feet'"),
            category: z.string().optional().describe("Optional category hint to narrow the search"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("ai_element_filter", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 3. Reset model view
    server.tool(
        "reset_view",
        "Reset the current view to default settings (zoom extents, clear overrides).",
        {
            clearOverrides: z.boolean().optional().describe("Clear all graphic overrides (default: false)"),
            zoomExtents: z.boolean().optional().describe("Zoom to fit all elements (default: true)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("reset_view", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 4. Select elements
    server.tool(
        "select_elements",
        "Select specific elements in Revit by their IDs.",
        {
            elementIds: z.array(z.number()).describe("Element IDs to select"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("select_elements", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 5. Get model statistics
    server.tool(
        "get_model_statistics",
        "Get comprehensive model statistics: element counts by category, total elements, file size, warnings count, etc.",
        {},
        async () => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("get_model_statistics", {})
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );
}
