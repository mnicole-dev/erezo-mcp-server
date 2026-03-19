const API_BASE = process.env['EREZO_API_URL'] ?? 'https://www.erezo.fr';

function getApiKey(): string {
  const key = process.env['EREZO_API_KEY'];
  if (!key) throw new Error('EREZO_API_KEY environment variable is required');
  return key;
}

export async function apiFetch(
  path: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<Response> {
  let url = `${API_BASE}${path}`;
  if (options?.params) {
    const filtered = Object.fromEntries(
      Object.entries(options.params).filter(([, v]) => v !== undefined && v !== '')
    );
    const qs = new URLSearchParams(filtered).toString();
    if (qs) url += `?${qs}`;
  }
  const { params: _, ...fetchOptions } = options ?? {};
  return fetch(url, {
    ...fetchOptions,
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json',
      ...fetchOptions?.headers,
    },
  });
}

export async function assertOk(resp: Response, action: string): Promise<unknown> {
  if (resp.status === 204) return null;
  if (resp.ok) return resp.json();

  const body = await resp.text();
  const status = resp.status;

  switch (status) {
    case 401:
      throw new Error(`${action}: Invalid API key or expired token`);
    case 403:
      throw new Error(`${action}: Access denied — you don't own this resource`);
    case 404:
      throw new Error(`${action}: Resource not found`);
    case 422:
      throw new Error(`${action}: Validation error — ${body}`);
    case 429:
      throw new Error(`${action}: Quota exceeded — ${body}`);
    default:
      throw new Error(`${action} failed (${status}): ${body}`);
  }
}

export function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
