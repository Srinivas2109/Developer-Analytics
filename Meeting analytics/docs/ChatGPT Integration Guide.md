# ChatGPT Integration Guide

This guide explains how to integrate the Meeting Intelligence MCP server with ChatGPT or other LLM clients.

## Steps
1. **Build and run the MCP server:**
   - Build: `npm run build`
   - Run: `node build/index.js`
2. **Configure your LLM client (e.g., Claude for Desktop, ChatGPT, etc.)**
   - Add a new MCP server entry pointing to the built server executable.
   - Example configuration for Claude for Desktop:
     ```json
     {
       "mcpServers": {
         "meeting-intelligence": {
           "command": "node",
           "args": ["C:/ABSOLUTE/PATH/TO/Meeting analytics/build/index.js"]
         }
       }
     }
     ```
   - Replace the path with your actual build output location.
3. **Test the integration:**
   - Use the LLM client to call tools exposed by the MCP server.

## References
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/quickstart/server)
- [MCP SDK for Node.js](https://github.com/modelcontextprotocol/sdk)
