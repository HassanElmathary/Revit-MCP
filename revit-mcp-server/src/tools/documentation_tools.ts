import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withRevitConnection } from "../utils/ConnectionManager.js";

/**
 * Documentation Tools — 8 tools for sheets, views, exports
 */
export function registerDocumentationTools(server: McpServer) {

    // 1. Place view on sheet
    server.tool(
        "place_view_on_sheet",
        "Place a view onto a sheet as a viewport.",
        {
            sheetId: z.number().describe("Sheet element ID"),
            viewId: z.number().describe("View element ID to place"),
            x: z.number().optional().describe("Viewport X position on the sheet (feet, default: center)"),
            y: z.number().optional().describe("Viewport Y position on the sheet (feet, default: center)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("place_view_on_sheet", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 2. Create viewport
    server.tool(
        "create_viewport",
        "Create a viewport on a sheet with specific settings.",
        {
            sheetNumber: z.string().describe("Sheet number to place on"),
            viewName: z.string().describe("View name to place"),
            x: z.number().optional().describe("X position on sheet"),
            y: z.number().optional().describe("Y position on sheet"),
            scale: z.number().optional().describe("Viewport scale override"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_viewport", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 3. Export schedules to CSV
    server.tool(
        "export_schedule",
        "Export a schedule's data as structured text (CSV format).",
        {
            scheduleId: z.number().optional().describe("Schedule element ID (if omitted, lists all schedules)"),
            scheduleName: z.string().optional().describe("Schedule name (alternative to ID)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("export_schedule", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 4. Create legend view
    server.tool(
        "create_legend",
        "Create a new legend view in the project.",
        {
            legendName: z.string().describe("Name for the legend view"),
            scale: z.number().optional().describe("Legend scale (default: 1:100)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_legend", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 5. Add revision
    server.tool(
        "add_revision",
        "Add a new revision to the project.",
        {
            date: z.string().describe("Revision date, e.g. '2025-02-20'"),
            description: z.string().describe("Revision description"),
            issuedBy: z.string().optional().describe("Issued by name"),
            issuedTo: z.string().optional().describe("Issued to name"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("add_revision", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 6. Print/export sheets
    server.tool(
        "print_sheets",
        "Print or export selected sheets to PDF.",
        {
            sheetNumbers: z.array(z.string()).optional().describe("Sheet numbers to print (default: all sheets)"),
            outputPath: z.string().optional().describe("Output folder path for PDF files"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("print_sheets", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 7. Export DWG
    server.tool(
        "export_dwg",
        "Export views or sheets to DWG format.",
        {
            viewIds: z.array(z.number()).optional().describe("View IDs to export"),
            sheetIds: z.array(z.number()).optional().describe("Sheet IDs to export"),
            outputPath: z.string().describe("Output directory path"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("export_dwg", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 8. Tag all elements in view
    server.tool(
        "tag_all_in_view",
        "Automatically tag all elements of a specific category in the current view.",
        {
            category: z.string().describe("Category to tag, e.g. 'Walls', 'Doors', 'Windows', 'Rooms'"),
            tagType: z.string().optional().describe("Tag family type name"),
            withLeader: z.boolean().optional().describe("Show leader lines (default: false)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("tag_all_in_view", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );
}
