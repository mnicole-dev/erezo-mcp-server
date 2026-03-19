# @mnicoledev/erezo-mcp-server

MCP server for the [eRezo](https://www.erezo.fr) API — manage your professional contacts and events directly from Claude.

## Tools (11)

### Contacts

| Tool | Description |
|------|-------------|
| `list_contacts` | List contacts with search, filters, and sorting |
| `get_contact` | Get contact details by UUID |
| `create_contact` | Create a new contact (subject to quota) |
| `update_contact` | Partial update of a contact |
| `delete_contact` | Delete a contact |
| `search_contacts` | Quick search by name, email, or company |

### Events

| Tool | Description |
|------|-------------|
| `list_events` | List upcoming events with filters |
| `get_event` | Get event details |
| `register_event` | Register for an event |
| `unregister_event` | Cancel event registration |

### Account

| Tool | Description |
|------|-------------|
| `get_me` | Get current user profile |

## Requirements

- Node.js 18+
- An eRezo API key

## Installation

```bash
npm install -g @mnicoledev/erezo-mcp-server
```

Or run directly with `npx`:

```bash
npx -y @mnicoledev/erezo-mcp-server
```

## Configuration

### Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "erezo": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@mnicoledev/erezo-mcp-server"],
      "env": {
        "EREZO_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "erezo": {
      "command": "npx",
      "args": ["-y", "@mnicoledev/erezo-mcp-server"],
      "env": {
        "EREZO_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

Add to Cursor MCP settings:

```json
{
  "mcpServers": {
    "erezo": {
      "command": "npx",
      "args": ["-y", "@mnicoledev/erezo-mcp-server"],
      "env": {
        "EREZO_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EREZO_API_KEY` | Yes | — | Your eRezo API key |
| `EREZO_API_URL` | No | `https://www.erezo.fr` | API base URL (for development) |

## Usage Examples

**List your contacts:**
> "Show me all my contacts"

**Create a contact:**
> "Create a contact for Jean Dupont, CTO at Acme Corp, met at Salon du Numérique"

**Find upcoming events:**
> "What events are coming up this month?"

## Development

```bash
git clone https://github.com/mnicole-dev/erezo-mcp-server.git
cd erezo-mcp-server
npm install
npm run dev
```

## License

MIT
