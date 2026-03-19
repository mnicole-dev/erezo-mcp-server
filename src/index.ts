#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerContactTools } from './tools/contacts.js';
import { registerEventTools } from './tools/events.js';
import { registerAccountTools } from './tools/account.js';

const server = new McpServer({
  name: 'erezo-mcp-server',
  version: '1.0.0',
});

registerContactTools(server);
registerEventTools(server);
registerAccountTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
