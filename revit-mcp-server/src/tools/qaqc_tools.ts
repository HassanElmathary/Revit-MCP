import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withRevitConnection } from "../utils/ConnectionManager.js";

/**
 * QA/QC Tools — 8 tools for model quality control and compliance checking
 */
export function registerQAQCTools(server: McpServer) {

    // 1. Check warnings
    server.tool(
        "check_warnings",
        "Get all active warnings in the Revit model. Useful for model cleanup and quality control.",
        {
            severity: z.enum(["All", "Error", "Warning"]).optional().describe("Filter by severity (default: All)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("check_warnings", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 2. Audit model
    server.tool(
        "audit_model",
        "Perform a comprehensive model audit: check for orphaned elements, unused families, missing views on sheets, etc.",
        {},
        async () => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("audit_model", {})
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 3. Check room compliance
    server.tool(
        "check_room_compliance",
        "Check rooms for compliance: minimum area requirements, accessibility, proper naming, and boundary closure.",
        {
            minArea: z.number().optional().describe("Minimum room area in square feet"),
            checkAccessibility: z.boolean().optional().describe("Check accessibility compliance (default: false)"),
            checkNaming: z.boolean().optional().describe("Check naming conventions (default: false)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("check_room_compliance", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 4. Check naming conventions
    server.tool(
        "check_naming_conventions",
        "Verify that views, sheets, and families follow naming conventions (regex pattern matching).",
        {
            category: z.enum(["Views", "Sheets", "Families", "Levels", "All"]).describe("Category to check"),
            pattern: z.string().optional().describe("Regex pattern for valid names (optional)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("check_naming_conventions", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 5. Find duplicates
    server.tool(
        "find_duplicates",
        "Find duplicate elements in the model (overlapping walls, duplicate rooms, etc.).",
        {
            category: z.string().describe("Category to check for duplicates, e.g. 'Walls', 'Rooms', 'Doors'"),
            tolerance: z.number().optional().describe("Distance tolerance in feet for considering elements as duplicates (default: 0.01)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("find_duplicates", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 6. Purge unused
    server.tool(
        "purge_unused",
        "Find and optionally purge unused families, types, and materials from the model.",
        {
            dryRun: z.boolean().optional().describe("If true, only lists what would be purged without deleting (default: true)"),
            categories: z.array(z.string()).optional().describe("Specific categories to purge (default: all)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("purge_unused", { dryRun: args.dryRun ?? true, categories: args.categories })
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 7. Check links status
    server.tool(
        "check_links_status",
        "Check the status of all linked models (loaded, unloaded, missing).",
        {},
        async () => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("check_links_status", {})
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 8. Validate parameters
    server.tool(
        "validate_parameters",
        "Validate that required parameters are filled in for elements of a specific category.",
        {
            category: z.string().describe("Category to validate, e.g. 'Doors', 'Windows', 'Rooms'"),
            requiredParameters: z.array(z.string()).describe("List of parameter names that must have values"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("validate_parameters", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );
}
