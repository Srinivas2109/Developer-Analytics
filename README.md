# MCP Developer Analytics Server

A Model Context Protocol (MCP) server that provides comprehensive analytics for GitHub developer profiles and repositories. This server allows AI assistants to analyze coding patterns, compare developers, and provide insights about development activity.

## Features

- **Developer Profile Analysis**: Get comprehensive profile information including repositories, languages, and activity patterns
- **Code Analytics**: Detailed analysis of repository metrics, language distribution, and coding patterns
- **Developer Comparison**: Side-by-side comparison of two developers
- **Trending Languages**: Analyze language usage trends over time
- **Activity Patterns**: Identify recent activity vs dormant repositories

## Installation

1. Clone this repository:
    ```bash
    git clone https://github.com/yourusername/mcp-developer-analytics.git
    cd mcp-developer-analytics
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Build the project:
    ```bash
    npm run build
    ```

4. (Optional) Set up GitHub token for higher rate limits:
    ```bash
    export GITHUB_TOKEN=your_github_token_here
    ```

## Usage

### Running the Server

```bash
npm start
```

### Available Tools

1. **analyze-developer**: Analyze a GitHub developer profile
   - Parameters: `username` (required)
   - Returns: Complete profile analysis with repositories and summary

2. **get-code-analytics**: Get detailed code analytics
   - Parameters: `username` (required), `limit` (optional, default: 30)
   - Returns: Comprehensive analytics including language breakdown and insights

3. **compare-developers**: Compare two developers
   - Parameters: `username1` (required), `username2` (required)
   - Returns: Side-by-side comparison with ratios and common languages

4. **get-trending-languages**: Analyze language trends
   - Parameters: `username` (required), `timeframe` ('recent' or 'all', default: 'all')
   - Returns: Language statistics and trend analysis

### Available Resources

- `github://profile`: Developer profile data
- `github://analytics`: Code analytics and patterns

## Configuration with Claude Desktop

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "developer-analytics": {
      "command": "node",
      "args": ["path/to/your/mcp-developer-analytics/build/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## Examples

### Analyzing a Developer
```typescript
// Use the analyze-developer tool
{
  "username": "octocat"
}
```

### Getting Code Analytics
```typescript
// Use the get-code-analytics tool
{
  "username": "octocat",
  "limit": 50
}
```

### Comparing Developers
```typescript
// Use the compare-developers tool
{
  "username1": "octocat",
  "username2": "torvalds"
}
```

## API Rate Limits

- **Without GitHub Token**: 60 requests per hour
- **With GitHub Token**: 5,000 requests per hour

It's highly recommended to set up a GitHub token for better performance.

## Development

```bash
# Watch mode for development
npm run dev

# Build
npm run build

# Run
npm start
```

## Project Structure

```
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Make sure you've run `npm install` and `npm run build`
2. **API rate limit exceeded**: Set up a GitHub token using the `GITHUB_TOKEN` environment variable
3. **Permission denied**: Make sure the built file is executable: `chmod +x build/index.js`

### Getting Help

- Check the [MCP documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- Open an issue on GitHub
- Review the server logs for error messages

## What Makes This Server Unique

This MCP server stands out because it:

1. **Provides Developer-Centric Analytics**: Unlike generic GitHub tools, this focuses specifically on developer profile analysis
2. **Offers Comparative Analysis**: Allows side-by-side comparison of developers
3. **Analyzes Coding Patterns**: Provides insights into language trends and repository activity
4. **Supports Temporal Analysis**: Can analyze trends over different time periods
5. **Optimized for AI Consumption**: Data is structured specifically for AI analysis and insights

The server is designed to help AI assistants understand developer profiles, coding patterns, and provide meaningful insights about software development activity.
