// Entrypoint for Meeting Intelligence MCP server
import { MeetingIntelligenceServer } from "./meetingIntelligenceServer.js";

const server = new MeetingIntelligenceServer();
server.run().catch(console.error);
