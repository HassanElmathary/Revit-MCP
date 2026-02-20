# Revit MCP — AI-Powered Revit Automation

> Model Context Protocol (MCP) server + Revit plugin for AI-driven BIM automation.

## Features

- **63 MCP Tools** across 6 categories:
  - 🔍 **Reading** (15): Query views, elements, parameters, rooms, levels, sheets, families, schedules
  - 🏗️ **Creating** (15): Walls, floors, ceilings, roofs, levels, grids, rooms, views, sheets, tags
  - ✏️ **Editing** (12): Modify, move, rotate, copy, delete, mirror, align, group, batch modify
  - 📄 **Documentation** (8): Sheets, viewports, exports, legends, revisions, tags
  - ✅ **QA/QC** (8): Warnings, audits, compliance, naming, duplicates, purge, validation
  - 🤖 **AI** (8): Gemini chat, code generation, model analysis, Google OAuth

- **Google Gemini 2.5** integration for natural language BIM interaction
- **Revit 2020–2026** support (multi-target plugin)
- **Auto-updater** via GitHub Releases
- **One-click installer** (.exe) with portable Node.js

## Architecture

```
┌─────────────────┐     MCP/stdio      ┌─────────────────┐     TCP/JSON-RPC     ┌─────────────────┐
│   AI Client     │◄──────────────────► │   MCP Server    │◄────────────────────►│  Revit Plugin   │
│ (Gemini/Claude) │                     │  (Node.js/TS)   │     port 8080        │   (C# Add-in)   │
└─────────────────┘                     └─────────────────┘                      └─────────────────┘
```

## Quick Start

### 1. Install Dependencies
```bash
cd revit-mcp-server
npm install
npm run build
```

### 2. Configure API Key
```bash
cp .env.example .env
# Edit .env with your Gemini API key
```

### 3. Configure MCP Client

Add to your MCP client config (e.g. Claude Desktop, Cursor, etc.):
```json
{
  "mcpServers": {
    "revit-mcp": {
      "command": "node",
      "args": ["d:/OneDrive/01-me/Revit MCP/revit-mcp-server/build/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your_key_here"
      }
    }
  }
}
```

### 4. Start in Revit
1. Load the Revit plugin (via installer or manual .addin)
2. Click **"Start MCP Service"** in the Revit ribbon
3. The AI client can now interact with your Revit model

## Project Structure

```
Revit MCP/
├── revit-mcp-server/          # MCP Server (TypeScript/Node.js)
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── ai/
│   │   │   └── gemini-service.ts
│   │   ├── auth/
│   │   │   └── google-oauth.ts
│   │   ├── tools/
│   │   │   ├── register.ts
│   │   │   ├── reading_tools.ts
│   │   │   ├── creating_tools.ts
│   │   │   ├── editing_tools.ts
│   │   │   ├── documentation_tools.ts
│   │   │   ├── qaqc_tools.ts
│   │   │   ├── advanced_tools.ts
│   │   │   └── ai_tools.ts
│   │   └── utils/
│   │       ├── SocketClient.ts
│   │       └── ConnectionManager.ts
│   └── package.json
│
├── revit-mcp-plugin/          # Revit Plugin (C# Add-in)
│   └── RevitMCPPlugin/
│       ├── Core/
│       │   ├── Application.cs
│       │   ├── SocketService.cs
│       │   ├── ExternalEventManager.cs
│       │   ├── CommandExecutor.cs
│       │   ├── UpdateChecker.cs
│       │   └── Logger.cs
│       ├── Commands/
│       │   └── Commands.cs
│       ├── RevitMCPPlugin.csproj
│       └── RevitMCP.addin
│
└── installer/                 # Inno Setup Installer
    └── setup.iss
```

## Tool Reference

| Tool | Description |
|------|-------------|
| `get_current_view_info` | Get active view details |
| `get_elements` | Get elements by category |
| `create_wall` | Create a new wall |
| `modify_parameter` | Set element parameter value |
| `audit_model` | Full model quality audit |
| `ai_chat` | Chat with Gemini about your model |
| `ai_generate_code` | Generate Revit API C# code |
| *...and 56 more* | See full list in tool files |

## Building the Installer

1. Compile the C# plugin in Visual Studio
2. Download [portable Node.js](https://nodejs.org/en/download/) to `installer/nodejs/`
3. Install [Inno Setup](https://jrsoftware.org/isinfo.php)
4. Compile `installer/setup.iss`

## License

MIT
