// All shared interfaces and types for Meeting Intelligence MCP

export interface MeetingTranscript {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  transcript: string;
  summary?: string;
  actionItems?: ActionItem[];
  keyTopics?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  followUpNeeded?: boolean;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  category: string;
}

export interface MeetingAnalytics {
  totalMeetings: number;
  totalHours: number;
  averageDuration: number;
  mostActiveParticipants: string[];
  commonTopics: string[];
  actionItemCompletionRate: number;
  meetingTrends: {
    weekly: number;
    monthly: number;
  };
}
