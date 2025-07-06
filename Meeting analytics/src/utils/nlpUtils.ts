// Utility functions for NLP, analytics, and helpers
import { ActionItem, MeetingTranscript } from "../interfaces.js";

export function extractActionItems(transcript: string, participants: string[]): ActionItem[] {
  // ...existing code...
  const actionItems: ActionItem[] = [];
  const lines = transcript.split('\n');
  const actionPatterns = [
    /(.+?)\s+(?:will|should|needs to|must)\s+(.+?)(?:\s+by\s+(.+?))?$/i,
    /action\s*item[:\s]*(.+?)(?:\s+[-–]\s*(.+?))?$/i,
    /(.+?)\s+is\s+responsible\s+for\s+(.+?)$/i,
    /(.+?)\s+to\s+follow\s+up\s+on\s+(.+?)$/i
  ];
  lines.forEach(line => {
    actionPatterns.forEach(pattern => {
      const match = line.match(pattern);
      if (match) {
        const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const assignee = participants.find(p => line.toLowerCase().includes(p.toLowerCase().split(' ')[0])) || "Unassigned";
        actionItems.push({
          id: actionId,
          description: match[2] || match[1],
          assignee,
          priority: determinePriority(line),
          status: "pending",
          category: categorizeAction(line)
        });
      }
    });
  });
  return actionItems;
}

export function generateSummary(transcript: string): string {
  // ...existing code...
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const importantSentences = sentences.filter(s =>
    s.toLowerCase().includes('decision') ||
    s.toLowerCase().includes('action') ||
    s.toLowerCase().includes('next step') ||
    s.toLowerCase().includes('important') ||
    s.toLowerCase().includes('key')
  );
  return importantSentences.slice(0, 3).join('. ') + '.';
}

export function extractKeyTopics(transcript: string): string[] {
  // ...existing code...
  const words = transcript.toLowerCase().split(/\W+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'need', 'we', 'you', 'they', 'i', 'he', 'she', 'it', 'this', 'that', 'these', 'those']);
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    if (word.length > 3 && !commonWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

export function analyzeSentiment(transcript: string): 'positive' | 'neutral' | 'negative' {
  // ...existing code...
  const positiveWords = ['great', 'excellent', 'good', 'positive', 'success', 'agree', 'perfect', 'wonderful', 'amazing', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'wrong', 'problem', 'issue', 'concern', 'worry', 'difficult', 'challenge', 'fail'];
  const words = transcript.toLowerCase().split(/\W+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export function needsFollowUp(transcript: string, actionItems: ActionItem[]): boolean {
  // ...existing code...
  const followUpIndicators = [
    'follow up', 'next meeting', 'circle back', 'check in', 'pending', 'waiting for', 'need to discuss', 'table this', 'revisit'
  ];
  const hasFollowUpLanguage = followUpIndicators.some(indicator => transcript.toLowerCase().includes(indicator));
  return hasFollowUpLanguage || actionItems.length > 0;
}

export function determinePriority(text: string): 'low' | 'medium' | 'high' {
  // ...existing code...
  const highPriorityWords = ['urgent', 'critical', 'asap', 'immediately', 'priority', 'important'];
  const lowPriorityWords = ['when possible', 'eventually', 'nice to have', 'if time permits'];
  const lowerText = text.toLowerCase();
  if (highPriorityWords.some(word => lowerText.includes(word))) return 'high';
  if (lowPriorityWords.some(word => lowerText.includes(word))) return 'low';
  return 'medium';
}

export function categorizeAction(text: string): string {
  // ...existing code...
  const categories = {
    'development': ['code', 'develop', 'build', 'implement', 'programming'],
    'research': ['research', 'investigate', 'analyze', 'study', 'explore'],
    'communication': ['email', 'call', 'message', 'contact', 'reach out'],
    'meeting': ['schedule', 'meeting', 'call', 'discussion', 'presentation'],
    'documentation': ['document', 'write', 'report', 'summary', 'notes'],
    'review': ['review', 'check', 'verify', 'validate', 'approve']
  };
  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  return 'general';
}
