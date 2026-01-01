# Authentication

All API requests require authentication. ZeroDrive uses Bearer token authentication to secure API access.

## Bearer Token Authentication

Include your API key in the `Authorization` header with all requests:

```bash
curl -X GET "https://drive.futurixai.com/api/v1/files" \
  -H "Authorization: Bearer zd_live_abc123..."
```

### Token Format

API keys follow the format: `zd_live_` followed by a unique identifier.

- **Live keys**: `zd_live_...` - Use in production environments
- **Test keys**: `zd_test_...` - Use in development and testing

## Using the SDK

### Python

```python
from zerodrive import ZeroDrive

# Initialize with your API key
client = ZeroDrive(api_key="zd_live_YOUR_API_KEY")

# All subsequent requests are automatically authenticated
files = client.files.list()
```

### Node.js

```javascript
import { ZeroDrive } from "zerodrive";

// Initialize with your API key
const client = new ZeroDrive({
  apiKey: "zd_live_YOUR_API_KEY",
});

// All subsequent requests are automatically authenticated
const files = await client.files.list();
```

## Scopes

API keys can be configured with specific scopes to limit access. Available scopes include:

| Scope                | Description                           |
| -------------------- | ------------------------------------- |
| `files:read`         | Read access to files                  |
| `files:write`        | Create, update, and delete files      |
| `folders:read`       | Read access to folders                |
| `folders:write`      | Create, update, and delete folders    |
| `workspaces:read`    | Read access to workspaces             |
| `workspaces:write`   | Create, update, and delete workspaces |
| `workspaces:members` | Manage workspace members              |
| `trash:read`         | View trashed items                    |
| `trash:write`        | Restore or permanently delete items   |

### Checking Required Scopes

Each endpoint documents its required scopes. For example, listing files requires the `files:read` scope:

```json
{
  "auth": {
    "required": true,
    "type": "bearer",
    "scopes": ["files:read"]
  }
}
```

## Error Responses

### 401 Unauthorized

Returned when authentication fails:

```json
{
  "error": "Missing or invalid authentication token",
  "code": "UNAUTHORIZED"
}
```

**Common causes:**

- Missing `Authorization` header
- Invalid or malformed API key
- Expired API key
- API key has been revoked

### 403 Forbidden

Returned when the API key lacks required scopes:

```json
{
  "error": "Insufficient permissions for this operation",
  "code": "FORBIDDEN"
}
```

**Solution:** Generate a new API key with the required scopes.

## Security Best Practices

### Keep Your Keys Secure

- Never expose API keys in client-side code
- Use environment variables to store keys
- Rotate keys periodically
- Use test keys in development

### Environment Variables

```bash
# .env file
ZERODRIVE_API_KEY=zd_live_YOUR_API_KEY
```

```python
import os
from zerodrive import ZeroDrive

client = ZeroDrive(api_key=os.environ["ZERODRIVE_API_KEY"])
```

```javascript
import { ZeroDrive } from "zerodrive";

const client = new ZeroDrive({
  apiKey: process.env.ZERODRIVE_API_KEY,
});
```

## Managing API Keys

API keys can be created and managed from your [ZeroDrive Dashboard](https://zerodrive.futurixai.com/settings/api-keys).

- Create new keys with specific scopes
- View key usage and analytics
- Revoke compromised keys
- Set expiration dates
