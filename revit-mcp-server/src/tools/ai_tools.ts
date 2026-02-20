import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGeminiService } from "../ai/gemini-service.js";
import { GoogleAuth } from "../auth/google-oauth.js";

/**
 * AI-specific tools — Gemini integration, auth, and AI-powered analysis
 */
export function registerAITools(server: McpServer) {

    const gemini = getGeminiService();
    const auth = new GoogleAuth();

    // 1. AI Chat
    server.tool(
        "ai_chat",
        "Send a message to Google Gemini AI for Revit-related help. Maintains conversation context.",
        {
            message: z.string().describe("Your message or question for the AI"),
            model: z.enum(["gemini-2.5-flash", "gemini-2.5-pro"]).optional().describe("AI model (default: gemini-2.5-flash)"),
        },
        async (args) => {
            try {
                if (args.model) gemini.setModel(args.model);
                const response = await gemini.chat(args.message);
                return { content: [{ type: "text", text: response }] };
            } catch (error) {
                return { content: [{ type: "text", text: `AI error: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 2. AI Single prompt (no history)
    server.tool(
        "ai_generate",
        "Generate a single AI response without conversation history. Good for one-off questions.",
        {
            prompt: z.string().describe("The prompt to send to Gemini"),
        },
        async (args) => {
            try {
                const response = await gemini.generate(args.prompt);
                return { content: [{ type: "text", text: response }] };
            } catch (error) {
                return { content: [{ type: "text", text: `AI error: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 3. Analyze model with AI
    server.tool(
        "ai_analyze_model",
        "Use AI to analyze Revit model data and provide insights, issues, and recommendations.",
        {
            modelData: z.record(z.unknown()).describe("Model data to analyze (from get_model_statistics or audit_model)"),
        },
        async (args) => {
            try {
                const response = await gemini.analyzeModel(args.modelData);
                return { content: [{ type: "text", text: response }] };
            } catch (error) {
                return { content: [{ type: "text", text: `AI error: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 4. Generate Revit code with AI
    server.tool(
        "ai_generate_code",
        "Use AI to generate C# code for the Revit API from a natural language description.",
        {
            description: z.string().describe("Describe what the code should do in plain English"),
        },
        async (args) => {
            try {
                const response = await gemini.generateRevitCode(args.description);
                return { content: [{ type: "text", text: response }] };
            } catch (error) {
                return { content: [{ type: "text", text: `AI error: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 5. Clear AI chat history
    server.tool(
        "ai_clear_history",
        "Clear the AI conversation history to start a fresh chat.",
        {},
        async () => {
            gemini.clearHistory();
            return { content: [{ type: "text", text: "AI conversation history cleared." }] };
        }
    );

    // 6. Google Sign-In
    server.tool(
        "google_sign_in",
        "Sign in with your Google account for AI features. Opens a browser window for authentication.",
        {},
        async () => {
            try {
                await auth.authorize();
                return { content: [{ type: "text", text: "✅ Signed in successfully! Gemini AI features are now available." }] };
            } catch (error) {
                return { content: [{ type: "text", text: `Sign-in failed: ${error instanceof Error ? error.message : String(error)}` }] };
            }
        }
    );

    // 7. Google Sign-Out
    server.tool(
        "google_sign_out",
        "Sign out of your Google account.",
        {},
        async () => {
            auth.signOut();
            return { content: [{ type: "text", text: "Signed out of Google account." }] };
        }
    );

    // 8. Auth Status
    server.tool(
        "auth_status",
        "Check the current Google authentication status.",
        {},
        async () => {
            const status = auth.isAuthenticated ? "Authenticated ✅" : "Not authenticated ❌";
            return { content: [{ type: "text", text: `Google Auth Status: ${status}` }] };
        }
    );
}
