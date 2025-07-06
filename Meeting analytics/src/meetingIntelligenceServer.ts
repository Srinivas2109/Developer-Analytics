import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import path from 'path';
import {
  MeetingTranscript,
  ActionItem,
  MeetingAnalytics
} from "./interfaces.js";
import {
  extractActionItems,
  generateSummary,
  extractKeyTopics,
  analyzeSentiment,
  needsFollowUp
} from "./utils/nlpUtils.js";
import {
  getMostActiveParticipants,
  getCommonTopics,
  getActionItemCompletionRate,
  getMeetingTrend
} from "./utils/analyticsUtils.js";

export class MeetingIntelligenceServer {
  private server: Server;
  private meetingsData: Map<string, MeetingTranscript> = new Map();
  private actionItems: Map<string, ActionItem> = new Map();
  private dataDir: string;

  constructor() {
    this.dataDir = process.env.MEETING_DATA_DIR || './meeting_data';
    this.server = new Server(
      {
        name: "meeting-intelligence-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this.setupToolHandlers();
    this.loadExistingData();
  }

  private async analyzeMeetingTranscript(args: any) {
    const { title, transcript, participants, date, duration } = args;
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const actionItems = extractActionItems(transcript, participants);
    const summary = generateSummary(transcript);
    const keyTopics = extractKeyTopics(transcript);
    const sentiment = analyzeSentiment(transcript);
    const followUpNeeded = needsFollowUp(transcript, actionItems);
    const meeting: MeetingTranscript = {
      id: meetingId,
      title,
      date,
      duration,
      participants,
      transcript,
      summary,
      actionItems,
      keyTopics,
      sentiment,
      followUpNeeded
    };
    actionItems.forEach(item => {
      this.actionItems.set(item.id, item);
    });
    this.meetingsData.set(meetingId, meeting);
    await this.saveData();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            meetingId,
            summary: {
              title,
              duration: `${duration} minutes`,
              participants: participants.length,
              actionItems: actionItems.length,
              keyTopics: keyTopics.slice(0, 5),
              sentiment,
              followUpNeeded
            },
            actionItems: actionItems.map(item => ({
              id: item.id,
              description: item.description,
              assignee: item.assignee,
              priority: item.priority,
              category: item.category
            }))
          }, null, 2)
        }
      ]
    };
  }

  private async loadExistingData() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      // Load meetings
      const meetingsFile = path.join(this.dataDir, 'meetings.json');
      try {
        const data = await fs.readFile(meetingsFile, 'utf-8');
        const meetings = JSON.parse(data);
        meetings.forEach((meeting: MeetingTranscript) => {
          this.meetingsData.set(meeting.id, meeting);
        });
      } catch (error) {
        console.log('No existing meetings data found, starting fresh');
      }
      // Load action items
      const actionsFile = path.join(this.dataDir, 'actions.json');
      try {
        const data = await fs.readFile(actionsFile, 'utf-8');
        const actions = JSON.parse(data);
        actions.forEach((action: ActionItem) => {
          this.actionItems.set(action.id, action);
        });
      } catch (error) {
        console.log('No existing action items found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  }

  private async saveData() {
    try {
      // Save meetings
      const meetingsArray = Array.from(this.meetingsData.values());
      await fs.writeFile(
        path.join(this.dataDir, 'meetings.json'),
        JSON.stringify(meetingsArray, null, 2)
      );
      // Save action items
      const actionsArray = Array.from(this.actionItems.values());
      await fs.writeFile(
        path.join(this.dataDir, 'actions.json'),
        JSON.stringify(actionsArray, null, 2)
      );
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private setupToolHandlers() {
    // ...copy your setupToolHandlers method from your original class here...
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Meeting Intelligence MCP server running on stdio");
  }
}
