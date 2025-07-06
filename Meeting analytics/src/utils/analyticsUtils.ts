// Utility functions for analytics and statistics
import { MeetingTranscript, ActionItem } from "../interfaces.js";

export function getMostActiveParticipants(meetings: MeetingTranscript[]): string[] {
  const participantCount = new Map<string, number>();
  meetings.forEach(meeting => {
    meeting.participants.forEach(participant => {
      participantCount.set(participant, (participantCount.get(participant) || 0) + 1);
    });
  });
  return Array.from(participantCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([participant]) => participant);
}

export function getCommonTopics(meetings: MeetingTranscript[]): string[] {
  const allTopics = meetings.flatMap(m => m.keyTopics || []);
  const topicCount = new Map<string, number>();
  allTopics.forEach(topic => {
    topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
  });
  return Array.from(topicCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);
}

export function getActionItemCompletionRate(actionItems: ActionItem[]): number {
  if (actionItems.length === 0) return 0;
  const completedActions = actionItems.filter(a => a.status === "completed");
  return (completedActions.length / actionItems.length) * 100;
}

export function getMeetingTrend(meetings: MeetingTranscript[], period: 'week' | 'month'): number {
  const now = new Date();
  const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return meetings.filter(m => {
    const meetingDate = new Date(m.date);
    return now.getTime() - meetingDate.getTime() <= periodMs;
  }).length;
}
