import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withRevitConnection } from "../utils/ConnectionManager.js";

/**
 * Creating Tools — 15 tools for creating new elements in Revit
 */
export function registerCreatingTools(server: McpServer) {

    // 1. Create wall
    server.tool(
        "create_wall",
        "Create a new wall in Revit given start point, end point, level, height, and optionally a wall type.",
        {
            startX: z.number().describe("Start point X coordinate (feet)"),
            startY: z.number().describe("Start point Y coordinate (feet)"),
            endX: z.number().describe("End point X coordinate (feet)"),
            endY: z.number().describe("End point Y coordinate (feet)"),
            levelName: z.string().describe("Name of the level to place the wall on"),
            height: z.number().optional().describe("Wall height in feet (default: 10)"),
            wallType: z.string().optional().describe("Wall type name (default: first available)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_wall", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 2. Create line-based element (doors, windows, beams, etc.)
    server.tool(
        "create_line_based_element",
        "Create a line-based element such as a beam, brace, or structural framing member.",
        {
            familyName: z.string().describe("Family name of the element"),
            typeName: z.string().describe("Type name within the family"),
            startX: z.number().describe("Start point X (feet)"),
            startY: z.number().describe("Start point Y (feet)"),
            startZ: z.number().describe("Start point Z (feet)"),
            endX: z.number().describe("End point X (feet)"),
            endY: z.number().describe("End point Y (feet)"),
            endZ: z.number().describe("End point Z (feet)"),
            levelName: z.string().optional().describe("Level name"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_line_based_element", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 3. Create point-based element (doors, windows, furniture, fixtures)
    server.tool(
        "create_point_based_element",
        "Create a point-based element such as a door, window, furniture, or fixture at a specific location.",
        {
            familyName: z.string().describe("Family name"),
            typeName: z.string().describe("Type name"),
            x: z.number().describe("X coordinate (feet)"),
            y: z.number().describe("Y coordinate (feet)"),
            z: z.number().optional().describe("Z coordinate (feet, default: 0)"),
            levelName: z.string().optional().describe("Level name"),
            hostElementId: z.number().optional().describe("Host element ID (e.g. wall ID for doors/windows)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_point_based_element", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 4. Create floor
    server.tool(
        "create_floor",
        "Create a floor element from boundary points on a specific level.",
        {
            points: z.array(z.object({
                x: z.number().describe("X coordinate (feet)"),
                y: z.number().describe("Y coordinate (feet)"),
            })).describe("Boundary points defining the floor outline (minimum 3 points)"),
            levelName: z.string().describe("Level name"),
            floorType: z.string().optional().describe("Floor type name (default: first available)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_floor", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 5. Create ceiling
    server.tool(
        "create_ceiling",
        "Create a ceiling element from boundary points on a specific level.",
        {
            points: z.array(z.object({
                x: z.number().describe("X coordinate (feet)"),
                y: z.number().describe("Y coordinate (feet)"),
            })).describe("Boundary points defining the ceiling outline"),
            levelName: z.string().describe("Level name"),
            ceilingType: z.string().optional().describe("Ceiling type name"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_ceiling", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 6. Create roof
    server.tool(
        "create_roof",
        "Create a roof element from a footprint on a specific level.",
        {
            points: z.array(z.object({
                x: z.number().describe("X coordinate (feet)"),
                y: z.number().describe("Y coordinate (feet)"),
            })).describe("Footprint points defining the roof outline"),
            levelName: z.string().describe("Level name"),
            roofType: z.string().optional().describe("Roof type name"),
            slope: z.number().optional().describe("Roof slope angle in degrees"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_roof", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 7. Create level
    server.tool(
        "create_level",
        "Create a new level at a specified elevation.",
        {
            name: z.string().describe("Level name, e.g. 'Level 3'"),
            elevation: z.number().describe("Elevation in feet"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_level", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 8. Create grid
    server.tool(
        "create_grid",
        "Create a grid line from a start point to an end point.",
        {
            name: z.string().describe("Grid name, e.g. 'A', '1'"),
            startX: z.number().describe("Start X (feet)"),
            startY: z.number().describe("Start Y (feet)"),
            endX: z.number().describe("End X (feet)"),
            endY: z.number().describe("End Y (feet)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_grid", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 9. Create room
    server.tool(
        "create_room",
        "Place a room at a specific location on a level. The room will automatically detect its boundaries from surrounding walls.",
        {
            x: z.number().describe("X coordinate inside the room boundary (feet)"),
            y: z.number().describe("Y coordinate inside the room boundary (feet)"),
            levelName: z.string().describe("Level name"),
            roomName: z.string().optional().describe("Room name"),
            roomNumber: z.string().optional().describe("Room number"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_room", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 10. Create sheet
    server.tool(
        "create_sheet",
        "Create a new sheet in the Revit project.",
        {
            sheetNumber: z.string().describe("Sheet number, e.g. 'A101'"),
            sheetName: z.string().describe("Sheet name, e.g. 'Floor Plan - Level 1'"),
            titleBlockName: z.string().optional().describe("Title block family name (default: first available)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_sheet", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 11. Create view
    server.tool(
        "create_view",
        "Create a new view in the Revit project.",
        {
            viewType: z.enum(["FloorPlan", "CeilingPlan", "Section", "Elevation", "3D", "Drafting"]).describe("Type of view to create"),
            levelName: z.string().optional().describe("Level name (for floor/ceiling plans)"),
            viewName: z.string().optional().describe("Custom view name"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_view", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 12. Create schedule
    server.tool(
        "create_schedule",
        "Create a new schedule/quantity takeoff in the Revit project.",
        {
            category: z.string().describe("Category for the schedule, e.g. 'Walls', 'Doors', 'Rooms'"),
            scheduleName: z.string().describe("Name for the new schedule"),
            fields: z.array(z.string()).optional().describe("Parameter names to include as columns"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_schedule", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 13. Create tag
    server.tool(
        "create_tag",
        "Create a tag annotation for an element in the current view.",
        {
            elementId: z.number().describe("Element ID to tag"),
            tagType: z.string().optional().describe("Tag family type name"),
            offsetX: z.number().optional().describe("Tag offset X from element center (feet)"),
            offsetY: z.number().optional().describe("Tag offset Y from element center (feet)"),
            withLeader: z.boolean().optional().describe("Show leader line (default: false)"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_tag", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 14. Create dimension
    server.tool(
        "create_dimension",
        "Create a dimension annotation between two points or references in the current view.",
        {
            elementIds: z.array(z.number()).describe("Element IDs to dimension between (2 elements)"),
            dimensionType: z.string().optional().describe("Dimension type name"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_dimension", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 15. Create text note
    server.tool(
        "create_text_note",
        "Create a text note annotation in the current view.",
        {
            text: z.string().describe("Text content"),
            x: z.number().describe("X position (feet)"),
            y: z.number().describe("Y position (feet)"),
            textType: z.string().optional().describe("Text note type name"),
        },
        async (args) => {
            try {
                const response = await withRevitConnection(async (client) =>
                    client.sendCommand("create_text_note", args)
                );
                return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );
}
