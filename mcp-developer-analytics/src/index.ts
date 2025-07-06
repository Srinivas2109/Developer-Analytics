#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Types for our developer analytics
interface GitHubRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  created_at: string;
  updated_at: string;
  size: number;
  topics: string[];
}

interface DeveloperProfile {
  username: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  location: string;
  company: string;
}

interface CodeAnalytics {
  totalRepos: number;
  languageBreakdown: Record<string, number>;
  totalStars: number;
  totalForks: number;
  avgRepoSize: number;
  mostPopularRepo: string;
  topicsFrequency: Record<string, number>;
  activityPattern: {
    recentlyActive: number;
    dormant: number;
  };
}

class DeveloperAnalyticsServer {
  private server: Server;
  private githubToken?: string;

  constructor() {
    this.server = new Server(
      {
        name: 'developer-analytics',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.githubToken = process.env.GITHUB_TOKEN;
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'github://profile',
            mimeType: 'application/json',
            name: 'GitHub Profile Data',
            description: 'Comprehensive developer profile analysis',
          },
          {
            uri: 'github://analytics',
            mimeType: 'application/json',
            name: 'Code Analytics',
            description: 'Repository analytics and coding patterns',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      if (uri === 'github://profile') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                message: 'Use the analyze-developer tool to get profile data',
                example: 'analyze-developer with username parameter',
              }),
            },
          ],
        };
      } else if (uri === 'github://analytics') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                message: 'Use the get-code-analytics tool to get analytics data',
                example: 'get-code-analytics with username parameter',
              }),
            },
          ],
        };
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze-developer',
            description: 'Analyze a GitHub developer profile and repositories',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'GitHub username to analyze',
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'get-code-analytics',
            description: 'Get detailed code analytics for a developer',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'GitHub username for analytics',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of repositories to analyze',
                  default: 30,
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'compare-developers',
            description: 'Compare two developers side by side',
            inputSchema: {
              type: 'object',
              properties: {
                username1: {
                  type: 'string',
                  description: 'First developer username',
                },
                username2: {
                  type: 'string',
                  description: 'Second developer username',
                },
              },
              required: ['username1', 'username2'],
            },
          },
          {
            name: 'get-trending-languages',
            description: 'Analyze trending programming languages from a developer portfolio',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'GitHub username to analyze language trends',
                },
                timeframe: {
                  type: 'string',
                  enum: ['recent', 'all'],
                  description: 'Time frame for analysis',
                  default: 'all',
                },
              },
              required: ['username'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze-developer': {
            if (!args || typeof args !== 'object' || typeof (args as any).username !== 'string') {
              throw new McpError(ErrorCode.InvalidRequest, 'Missing or invalid "username" argument');
            }
            return await this.analyzeDeveloper((args as any).username);
          }
          case 'get-code-analytics': {
            if (!args || typeof args !== 'object' || typeof (args as any).username !== 'string') {
              throw new McpError(ErrorCode.InvalidRequest, 'Missing or invalid "username" argument');
            }
            const username = (args as any).username as string;
            const limit = typeof (args as any).limit === 'number' ? (args as any).limit : 30;
            return await this.getCodeAnalytics(username, limit);
          }
          case 'compare-developers': {
            if (!args || typeof args !== 'object' || typeof (args as any).username1 !== 'string' || typeof (args as any).username2 !== 'string') {
              throw new McpError(ErrorCode.InvalidRequest, 'Missing or invalid "username1" or "username2" argument');
            }
            return await this.compareDevelopers((args as any).username1, (args as any).username2);
          }
          case 'get-trending-languages': {
            if (!args || typeof args !== 'object' || typeof (args as any).username !== 'string') {
              throw new McpError(ErrorCode.InvalidRequest, 'Missing or invalid "username" argument');
            }
            const username = (args as any).username as string;
            const timeframe = typeof (args as any).timeframe === 'string' ? (args as any).timeframe : 'all';
            return await this.getTrendingLanguages(username, timeframe);
          }
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  private async makeGitHubRequest(url: string) {
    const headers: Record<string, string> = {
      'User-Agent': 'MCP-Developer-Analytics/1.0.0',
    };

    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    const response = await axios.get(url, { headers });
    return response.data;
  }

  private async analyzeDeveloper(username: string) {
    const profileData = await this.makeGitHubRequest(
      `https://api.github.com/users/${username}`
    );

    const reposData = await this.makeGitHubRequest(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
    );

    const profile: DeveloperProfile = {
      username: profileData.login,
      name: profileData.name || 'N/A',
      bio: profileData.bio || 'N/A',
      public_repos: profileData.public_repos,
      followers: profileData.followers,
      following: profileData.following,
      created_at: profileData.created_at,
      location: profileData.location || 'N/A',
      company: profileData.company || 'N/A',
    };

    const repos: GitHubRepo[] = reposData.map((repo: any) => ({
      name: repo.name,
      description: repo.description || 'No description',
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      size: repo.size,
      topics: repo.topics || [],
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            profile,
            repositories: repos,
            summary: {
              totalRepos: repos.length,
              totalStars: repos.reduce((sum, repo) => sum + repo.stars, 0),
              primaryLanguages: this.getTopLanguages(repos, 5),
              joinedDate: new Date(profile.created_at).toLocaleDateString(),
            },
          }, null, 2),
        },
      ],
    };
  }

  private async getCodeAnalytics(username: string, limit: number) {
    const reposData = await this.makeGitHubRequest(
      `https://api.github.com/users/${username}/repos?per_page=${limit}&sort=updated`
    );

    const repos: GitHubRepo[] = reposData.map((repo: any) => ({
      name: repo.name,
      description: repo.description || 'No description',
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      size: repo.size,
      topics: repo.topics || [],
    }));

    const analytics: CodeAnalytics = {
      totalRepos: repos.length,
      languageBreakdown: this.getLanguageBreakdown(repos),
      totalStars: repos.reduce((sum, repo) => sum + repo.stars, 0),
      totalForks: repos.reduce((sum, repo) => sum + repo.forks, 0),
      avgRepoSize: repos.reduce((sum, repo) => sum + repo.size, 0) / repos.length,
      mostPopularRepo: repos.reduce((prev, current) => 
        prev.stars > current.stars ? prev : current
      ).name,
      topicsFrequency: this.getTopicsFrequency(repos),
      activityPattern: this.getActivityPattern(repos),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            analytics,
            insights: this.generateInsights(analytics),
          }, null, 2),
        },
      ],
    };
  }

  private async compareDevelopers(username1: string, username2: string) {
    const [dev1Data, dev2Data] = await Promise.all([
      this.analyzeDeveloper(username1),
      this.analyzeDeveloper(username2),
    ]);

    const dev1 = JSON.parse(dev1Data.content[0].text);
    const dev2 = JSON.parse(dev2Data.content[0].text);

    const comparison = {
      developer1: {
        username: dev1.profile.username,
        stats: dev1.summary,
      },
      developer2: {
        username: dev2.profile.username,
        stats: dev2.summary,
      },
      comparison: {
        starsRatio: dev1.summary.totalStars / dev2.summary.totalStars,
        reposRatio: dev1.summary.totalRepos / dev2.summary.totalRepos,
        commonLanguages: this.findCommonLanguages(
          dev1.summary.primaryLanguages,
          dev2.summary.primaryLanguages
        ),
        experienceComparison: this.compareExperience(
          dev1.profile.created_at,
          dev2.profile.created_at
        ),
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comparison, null, 2),
        },
      ],
    };
  }

  private async getTrendingLanguages(username: string, timeframe: string) {
    const reposData = await this.makeGitHubRequest(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
    );

    let filteredRepos = reposData;

    if (timeframe === 'recent') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      filteredRepos = reposData.filter((repo: any) => 
        new Date(repo.updated_at) > sixMonthsAgo
      );
    }

    const languageStats = this.getLanguageBreakdown(filteredRepos);
    const trends = this.analyzeTrends(languageStats);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            timeframe,
            totalRepos: filteredRepos.length,
            languageStats,
            trends,
          }, null, 2),
        },
      ],
    };
  }

  // Helper methods
  private getTopLanguages(repos: GitHubRepo[], count: number): string[] {
    const languageCount = this.getLanguageBreakdown(repos);
    return Object.entries(languageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([lang]) => lang);
  }

  private getLanguageBreakdown(repos: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    repos.forEach(repo => {
      const lang = repo.language || 'Unknown';
      breakdown[lang] = (breakdown[lang] || 0) + 1;
    });
    return breakdown;
  }

  private getTopicsFrequency(repos: GitHubRepo[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    repos.forEach(repo => {
      repo.topics.forEach(topic => {
        frequency[topic] = (frequency[topic] || 0) + 1;
      });
    });
    return frequency;
  }

  private getActivityPattern(repos: GitHubRepo[]) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentlyActive = repos.filter(repo => 
      new Date(repo.updated_at) > oneYearAgo
    ).length;

    return {
      recentlyActive,
      dormant: repos.length - recentlyActive,
    };
  }

  private generateInsights(analytics: CodeAnalytics): string[] {
    const insights: string[] = [];

    const topLanguage = Object.entries(analytics.languageBreakdown)
      .sort(([,a], [,b]) => b - a)[0];

    if (topLanguage) {
      insights.push(`Primary language: ${topLanguage[0]} (${topLanguage[1]} repositories)`);
    }

    insights.push(`Average repository size: ${Math.round(analytics.avgRepoSize)} KB`);
    
    if (analytics.activityPattern.recentlyActive > analytics.activityPattern.dormant) {
      insights.push('High activity: More recently active repositories than dormant ones');
    } else {
      insights.push('Lower activity: More dormant repositories than recently active ones');
    }

    return insights;
  }

  private findCommonLanguages(langs1: string[], langs2: string[]): string[] {
    return langs1.filter(lang => langs2.includes(lang));
  }

  private compareExperience(date1: string, date2: string): string {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (d1 < d2) {
      return 'Developer 1 has more experience on GitHub';
    } else if (d1 > d2) {
      return 'Developer 2 has more experience on GitHub';
    } else {
      return 'Both developers joined GitHub around the same time';
    }
  }

  private analyzeTrends(languageStats: Record<string, number>): any {
    const total = Object.values(languageStats).reduce((sum, count) => sum + count, 0);
    const percentages = Object.entries(languageStats).map(([lang, count]) => ({
      language: lang,
      percentage: Math.round((count / total) * 100),
      repositories: count,
    }));

    return {
      dominantLanguage: percentages[0]?.language || 'N/A',
      diversity: Object.keys(languageStats).length,
      distribution: percentages.sort((a, b) => b.percentage - a.percentage),
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Developer Analytics MCP server running on stdio');
  }
}

const server = new DeveloperAnalyticsServer();
server.run().catch(console.error);
