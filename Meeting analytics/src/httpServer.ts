import Fastify from "fastify";
import { MeetingIntelligenceServer } from "./meetingIntelligenceServer.js";

const fastify = Fastify();
const mcp = new MeetingIntelligenceServer();

fastify.post("/analyze_meeting_transcript", async (request, reply) => {
  try {
    // @ts-ignore
    const result = await mcp.analyzeMeetingTranscript(request.body);
    reply.send(result);
  } catch (e: any) {
    reply.status(500).send({ error: e.message });
  }
});

fastify.post("/get_meeting_summary", async (request, reply) => {
  try {
    // @ts-ignore
    const result = await mcp.getMeetingSummary(request.body);
    reply.send(result);
  } catch (e: any) {
    reply.status(500).send({ error: e.message });
  }
});

fastify.post("/track_action_items", async (request, reply) => {
  try {
    // @ts-ignore
    const result = await mcp.trackActionItems(request.body);
    reply.send(result);
  } catch (e: any) {
    reply.status(500).send({ error: e.message });
  }
});

fastify.post("/generate_meeting_analytics", async (request, reply) => {
  try {
    // @ts-ignore
    const result = await mcp.generateMeetingAnalytics(request.body);
    reply.send(result);
  } catch (e: any) {
    reply.status(500).send({ error: e.message });
  }
});

fastify.post("/find_follow_up_meetings", async (request, reply) => {
  try {
    // @ts-ignore
    const result = await mcp.findFollowUpMeetings(request.body);
    reply.send(result);
  } catch (e: any) {
    reply.status(500).send({ error: e.message });
  }
});

fastify.post("/extract_meeting_insights", async (request, reply) => {
  try {
    // @ts-ignore
    const result = await mcp.extractMeetingInsights(request.body);
    reply.send(result);
  } catch (e: any) {
    reply.status(500).send({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
fastify.listen({ port: Number(PORT) }, (err, address) => {
  if (err) throw err;
  console.log(`MCP HTTP API running on ${address}`);
});
