import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiFetch, assertOk, textResult } from '../client.js';
import type { Event, PaginatedResponse } from '../types.js';

function formatEvent(e: Event): string {
  const lines = [
    `**${e.title}** (ID: \`${e.id}\`)`,
    `  Status: ${e.statusLabel ?? e.status}`,
    `  Date: ${new Date(e.startDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
  ];
  if (e.endDate) {
    lines.push(`  End: ${new Date(e.endDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
  }
  if (e.location) lines.push(`  Location: ${e.location}`);
  if (e.department) lines.push(`  Department: ${e.departmentLabel ?? e.department}`);
  lines.push(`  Price: ${e.formattedPrice ?? (e.price === 0 ? 'Gratuit' : `${e.price}€`)}`);
  if (e.organizerName ?? e.organizer?.name) {
    lines.push(`  Organizer: ${e.organizerName ?? e.organizer?.name}`);
  }
  lines.push(`  Participants: ${e.registeredCount}${e.maxParticipants ? `/${e.maxParticipants}` : ''}`);
  if (e.isRegistrationFull) lines.push(`  ⚠ Registration full`);
  if (e.isUserRegistered) lines.push(`  ✓ You are registered`);
  if (e.description) lines.push(`  Description: ${e.description}`);
  if (e.registrationLink) lines.push(`  Registration link: ${e.registrationLink}`);
  return lines.join('\n');
}

export function registerEventTools(server: McpServer) {
  // ── List Events ──────
  server.tool(
    'list_events',
    'List upcoming events with optional filters by organizer, department, or date range. Returns paginated results.',
    {
      organizer: z.number().optional().describe('Filter by organizer ID'),
      department: z.string().optional().describe('Filter by department code'),
      startDate: z.string().optional().describe('Minimum start date (ISO 8601)'),
      endDate: z.string().optional().describe('Maximum end date (ISO 8601)'),
      page: z.number().optional().describe('Page number (default: 1)'),
      limit: z.number().optional().describe('Items per page (default: 20, max: 100)'),
    },
    async (params) => {
      const queryParams: Record<string, string> = {};
      if (params.organizer) queryParams['organizer'] = String(params.organizer);
      if (params.department) queryParams['department'] = params.department;
      if (params.startDate) queryParams['startDate'] = params.startDate;
      if (params.endDate) queryParams['endDate'] = params.endDate;
      if (params.page) queryParams['page'] = String(params.page);
      if (params.limit) queryParams['limit'] = String(params.limit);

      const resp = await apiFetch('/api/v1/events', { params: queryParams });
      const data = await assertOk(resp, 'List events') as PaginatedResponse<Event>;

      const events = data.data ?? [];
      if (events.length === 0) return textResult('No upcoming events found.');

      const header = data.pagination
        ? `Showing page ${data.pagination.page}/${data.pagination.totalPages} (${data.pagination.total} total events)\n\n`
        : '';
      return textResult(header + events.map(formatEvent).join('\n\n---\n\n'));
    }
  );

  // ── Get Event ──────
  server.tool(
    'get_event',
    'Get detailed information about a specific event by its ID.',
    {
      id: z.number().describe('Event ID'),
    },
    async (params) => {
      const resp = await apiFetch(`/api/v1/events/${params.id}`);
      const data = await assertOk(resp, 'Get event') as { data?: Event } | Event;
      const event = 'data' in data && data.data ? data.data : data as Event;
      return textResult(formatEvent(event));
    }
  );

  // ── Register for Event ──────
  server.tool(
    'register_event',
    'Register the current user for an event. Fails if the event is cancelled, past, or full.',
    {
      id: z.number().describe('Event ID to register for'),
    },
    async (params) => {
      const resp = await apiFetch(`/api/v1/events/${params.id}/register`, { method: 'POST' });
      const data = await assertOk(resp, 'Register for event') as { data?: Event } | Event;
      const event = 'data' in data && data.data ? data.data : data as Event;
      return textResult(`Successfully registered for the event!\n\n${formatEvent(event)}`);
    }
  );

  // ── Unregister from Event ──────
  server.tool(
    'unregister_event',
    'Cancel the current user\'s registration for an event.',
    {
      id: z.number().describe('Event ID to unregister from'),
    },
    async (params) => {
      const resp = await apiFetch(`/api/v1/events/${params.id}/register`, { method: 'DELETE' });
      await assertOk(resp, 'Unregister from event');
      return textResult(`Successfully unregistered from event \`${params.id}\`.`);
    }
  );
}
