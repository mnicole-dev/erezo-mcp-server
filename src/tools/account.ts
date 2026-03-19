import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiFetch, assertOk, textResult } from '../client.js';
import type { User } from '../types.js';

export function registerAccountTools(server: McpServer) {
  // ── Get Me ──────
  server.tool(
    'get_me',
    'Get the current authenticated user\'s profile information including name, email, company, and roles.',
    {},
    async () => {
      const resp = await apiFetch('/api/v1/auth/me');
      const data = await assertOk(resp, 'Get current user') as { data?: User } | User;
      const user = 'data' in data && data.data ? data.data : data as User;

      const lines = [
        `**${user.firstName} ${user.lastName}**`,
        `  Email: ${user.email}`,
      ];
      if (user.company) lines.push(`  Company: ${user.company}`);
      if (user.profession) lines.push(`  Profession: ${user.profession}`);
      if (user.phone) lines.push(`  Phone: ${user.phone}`);
      lines.push(`  Roles: ${user.roles.join(', ')}`);

      return textResult(lines.join('\n'));
    }
  );
}
