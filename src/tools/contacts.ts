import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiFetch, assertOk, textResult } from '../client.js';
import type { Contact, PaginatedResponse } from '../types.js';

function formatContact(c: Contact): string {
  const lines = [
    `**${c.firstName} ${c.lastName}** (ID: \`${c.id}\`)`,
  ];
  if (c.company) lines.push(`  Company: ${c.company}`);
  if (c.profession) lines.push(`  Profession: ${c.profession}`);
  if (c.email) lines.push(`  Email: ${c.email}`);
  if (c.phone) lines.push(`  Phone: ${c.phone}`);
  if (c.status) lines.push(`  Status: ${c.status}`);
  if (c.trustLevel) lines.push(`  Trust level: ${c.trustLevel}/5`);
  if (c.tags?.length) lines.push(`  Tags: ${c.tags.join(', ')}`);
  if (c.notes) lines.push(`  Notes: ${c.notes}`);
  if (c.meetingPlace) lines.push(`  Met at: ${c.meetingPlace}`);
  if (c.meetingDate) lines.push(`  Met on: ${c.meetingDate}`);
  if (c.nextAction) lines.push(`  Next action: ${c.nextAction}${c.nextActionDate ? ` (${c.nextActionDate})` : ''}`);
  if (c.opportunityStatus) {
    const labels: Record<number, string> = { 1: 'Opportunity', 2: 'To explore', 3: 'Not interesting' };
    lines.push(`  Opportunity: ${labels[c.opportunityStatus] ?? c.opportunityStatus}`);
  }
  if (c.potentialRevenue) lines.push(`  Potential revenue: ${c.potentialRevenue}€`);
  if (c.isRecommendable) {
    lines.push(`  Recommendable: yes${c.recommendationNote ? ` — ${c.recommendationNote}` : ''}`);
    if (c.recommendationDomains?.length) lines.push(`  Recommendation domains: ${c.recommendationDomains.join(', ')}`);
  }
  if (c.interests?.length) lines.push(`  Interests: ${c.interests.join(', ')}`);
  if (c.preferredChannel) lines.push(`  Preferred channel: ${c.preferredChannel}`);
  if (c.languages?.length) lines.push(`  Languages: ${c.languages.join(', ')}`);
  if (c.birthday) lines.push(`  Birthday: ${c.birthday}`);
  if (c.address) lines.push(`  Address: ${c.address}`);
  if (c.websiteUrl) lines.push(`  Website: ${c.websiteUrl}`);
  if (c.twitterUrl) lines.push(`  Twitter: ${c.twitterUrl}`);
  if (c.instagramUrl) lines.push(`  Instagram: ${c.instagramUrl}`);
  if (c.githubUrl) lines.push(`  GitHub: ${c.githubUrl}`);
  if (c.tiktokUrl) lines.push(`  TikTok: ${c.tiktokUrl}`);
  return lines.join('\n');
}

export function registerContactTools(server: McpServer) {
  // ── List Contacts ──────
  server.tool(
    'list_contacts',
    'List contacts with optional search, filtering by status, and sorting. Returns paginated results.',
    {
      search: z.string().optional().describe('Search by first name, last name, email or company'),
      status: z.enum(['prospect', 'client', 'former_client', 'partner', 'supplier', 'network', 'other']).optional().describe('Filter by contact status'),
      page: z.number().optional().describe('Page number (default: 1)'),
      limit: z.number().optional().describe('Items per page (default: 30, max: 100)'),
      orderBy: z.enum(['firstName', 'lastName', 'company', 'createdAt', 'updatedAt']).optional().describe('Field to sort by'),
      orderDirection: z.enum(['asc', 'desc']).optional().describe('Sort direction (default: asc)'),
    },
    async (params) => {
      const queryParams: Record<string, string> = {};
      if (params.search) {
        queryParams['firstName'] = params.search;
        queryParams['lastName'] = params.search;
        queryParams['email'] = params.search;
        queryParams['company'] = params.search;
      }
      if (params.status) queryParams['status'] = params.status;
      if (params.page) queryParams['page'] = String(params.page);
      if (params.limit) queryParams['itemsPerPage'] = String(params.limit);
      if (params.orderBy) queryParams[`order[${params.orderBy}]`] = params.orderDirection ?? 'asc';

      const resp = await apiFetch('/api/v1/contacts', { params: queryParams });
      const data = await assertOk(resp, 'List contacts') as PaginatedResponse<Contact> | Contact[];

      if (Array.isArray(data)) {
        if (data.length === 0) return textResult('No contacts found.');
        return textResult(data.map(formatContact).join('\n\n---\n\n'));
      }

      const contacts = data.data ?? [];
      if (contacts.length === 0) return textResult('No contacts found.');

      const header = data.pagination
        ? `Showing page ${data.pagination.page}/${data.pagination.totalPages} (${data.pagination.total} total contacts)\n\n`
        : '';
      return textResult(header + contacts.map(formatContact).join('\n\n---\n\n'));
    }
  );

  // ── Get Contact ──────
  server.tool(
    'get_contact',
    'Get detailed information about a specific contact by its UUID.',
    {
      id: z.string().describe('UUID of the contact'),
    },
    async (params) => {
      const resp = await apiFetch(`/api/v1/contacts/${params.id}`);
      const data = await assertOk(resp, 'Get contact') as { data?: Contact } | Contact;
      const contact = 'data' in data && data.data ? data.data : data as Contact;
      return textResult(formatContact(contact));
    }
  );

  // ── Create Contact ──────
  server.tool(
    'create_contact',
    'Create a new contact. Subject to quota limits (freemium: 20 max, premium: 30/day).',
    {
      firstName: z.string().describe('First name (required)'),
      lastName: z.string().describe('Last name (required)'),
      email: z.string().optional().describe('Email address'),
      phone: z.string().optional().describe('Phone number'),
      company: z.string().optional().describe('Company name'),
      profession: z.string().optional().describe('Job title / profession'),
      notes: z.string().optional().describe('Free-text notes'),
      address: z.string().optional().describe('Postal address'),
      websiteUrl: z.string().optional().describe('Website URL'),
      meetingPlace: z.string().optional().describe('Where you met this person'),
      meetingDate: z.string().optional().describe('When you met (ISO 8601 date-time)'),
      status: z.enum(['prospect', 'client', 'former_client', 'partner', 'supplier', 'network', 'other']).optional().describe('Contact status (default: network)'),
      trustLevel: z.number().min(1).max(5).optional().describe('Trust level: 1=New, 2=Emerging, 3=Established, 4=Strong, 5=Total'),
      opportunityStatus: z.number().optional().describe('1=Opportunity, 2=To explore, 3=Not interesting'),
      isRecommendable: z.boolean().optional().describe('Whether this contact can be recommended'),
      recommendationNote: z.string().optional().describe('Note about recommendation'),
      tags: z.string().optional().describe('JSON array of tags, e.g. ["tech", "startup"]'),
      preferredChannel: z.enum(['email', 'phone', 'linkedin', 'whatsapp', 'sms', 'telegram']).optional().describe('Preferred communication channel'),
      interests: z.string().optional().describe('JSON array of interests'),
      birthday: z.string().optional().describe('Birthday (YYYY-MM-DD)'),
      languages: z.string().optional().describe('JSON array of language codes, e.g. ["fr", "en"]'),
      potentialRevenue: z.number().optional().describe('Potential revenue in euros'),
      nextAction: z.string().optional().describe('Next action to take'),
      nextActionDate: z.string().optional().describe('Deadline for next action (YYYY-MM-DD)'),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        firstName: params.firstName,
        lastName: params.lastName,
      };
      if (params.email) body.email = params.email;
      if (params.phone) body.phone = params.phone;
      if (params.company) body.company = params.company;
      if (params.profession) body.profession = params.profession;
      if (params.notes) body.notes = params.notes;
      if (params.address) body.address = params.address;
      if (params.websiteUrl) body.websiteUrl = params.websiteUrl;
      if (params.meetingPlace) body.meetingPlace = params.meetingPlace;
      if (params.meetingDate) body.meetingDate = params.meetingDate;
      if (params.status) body.status = params.status;
      if (params.trustLevel) body.trustLevel = params.trustLevel;
      if (params.opportunityStatus) body.opportunityStatus = params.opportunityStatus;
      if (params.isRecommendable !== undefined) body.isRecommendable = params.isRecommendable;
      if (params.recommendationNote) body.recommendationNote = params.recommendationNote;
      if (params.tags) body.tags = JSON.parse(params.tags);
      if (params.preferredChannel) body.preferredChannel = params.preferredChannel;
      if (params.interests) body.interests = JSON.parse(params.interests);
      if (params.birthday) body.birthday = params.birthday;
      if (params.languages) body.languages = JSON.parse(params.languages);
      if (params.potentialRevenue) body.potentialRevenue = params.potentialRevenue;
      if (params.nextAction) body.nextAction = params.nextAction;
      if (params.nextActionDate) body.nextActionDate = params.nextActionDate;

      const resp = await apiFetch('/api/v1/contacts', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await assertOk(resp, 'Create contact') as Contact;
      return textResult(`Contact created successfully!\n\n${formatContact(data)}`);
    }
  );

  // ── Update Contact ──────
  server.tool(
    'update_contact',
    'Update an existing contact. Only provided fields are modified (partial update).',
    {
      id: z.string().describe('UUID of the contact to update'),
      firstName: z.string().optional().describe('First name'),
      lastName: z.string().optional().describe('Last name'),
      email: z.string().optional().describe('Email address'),
      phone: z.string().optional().describe('Phone number'),
      company: z.string().optional().describe('Company name'),
      profession: z.string().optional().describe('Job title / profession'),
      notes: z.string().optional().describe('Free-text notes'),
      address: z.string().optional().describe('Postal address'),
      websiteUrl: z.string().optional().describe('Website URL'),
      meetingPlace: z.string().optional().describe('Where you met this person'),
      meetingDate: z.string().optional().describe('When you met (ISO 8601 date-time)'),
      status: z.enum(['prospect', 'client', 'former_client', 'partner', 'supplier', 'network', 'other']).optional().describe('Contact status'),
      trustLevel: z.number().min(1).max(5).optional().describe('Trust level 1-5'),
      opportunityStatus: z.number().optional().describe('1=Opportunity, 2=To explore, 3=Not interesting'),
      isRecommendable: z.boolean().optional().describe('Whether this contact can be recommended'),
      recommendationNote: z.string().optional().describe('Note about recommendation'),
      tags: z.string().optional().describe('JSON array of tags'),
      preferredChannel: z.enum(['email', 'phone', 'linkedin', 'whatsapp', 'sms', 'telegram']).optional().describe('Preferred communication channel'),
      interests: z.string().optional().describe('JSON array of interests'),
      birthday: z.string().optional().describe('Birthday (YYYY-MM-DD)'),
      languages: z.string().optional().describe('JSON array of language codes'),
      potentialRevenue: z.number().optional().describe('Potential revenue in euros'),
      nextAction: z.string().optional().describe('Next action to take'),
      nextActionDate: z.string().optional().describe('Deadline for next action (YYYY-MM-DD)'),
    },
    async (params) => {
      const { id, tags, interests, languages, ...rest } = params;
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) body[key] = value;
      }
      if (tags) body.tags = JSON.parse(tags);
      if (interests) body.interests = JSON.parse(interests);
      if (languages) body.languages = JSON.parse(languages);

      const resp = await apiFetch(`/api/v1/contacts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/merge-patch+json' },
      });
      const data = await assertOk(resp, 'Update contact') as Contact;
      return textResult(`Contact updated successfully!\n\n${formatContact(data)}`);
    }
  );

  // ── Delete Contact ──────
  server.tool(
    'delete_contact',
    'Permanently delete a contact by its UUID.',
    {
      id: z.string().describe('UUID of the contact to delete'),
    },
    async (params) => {
      const resp = await apiFetch(`/api/v1/contacts/${params.id}`, { method: 'DELETE' });
      await assertOk(resp, 'Delete contact');
      return textResult(`Contact \`${params.id}\` deleted successfully.`);
    }
  );

  // ── Search Contacts ──────
  server.tool(
    'search_contacts',
    'Quick search across contacts by name, email, or company. Returns the first page of matching results.',
    {
      query: z.string().describe('Search query (matches first name, last name, email, and company)'),
    },
    async (params) => {
      const resp = await apiFetch('/api/v1/contacts', {
        params: {
          firstName: params.query,
          lastName: params.query,
          email: params.query,
          company: params.query,
          itemsPerPage: '10',
        },
      });
      const data = await assertOk(resp, 'Search contacts') as PaginatedResponse<Contact> | Contact[];

      const contacts = Array.isArray(data) ? data : (data.data ?? []);
      if (contacts.length === 0) return textResult(`No contacts found for "${params.query}".`);
      return textResult(`Found ${contacts.length} contact(s) matching "${params.query}":\n\n` + contacts.map(formatContact).join('\n\n---\n\n'));
    }
  );
}
