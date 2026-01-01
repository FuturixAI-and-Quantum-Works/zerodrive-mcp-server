# Introduction

The ZeroDrive API allows you to programmatically manage files, folders, workspaces, and more. Our RESTful API uses standard HTTP methods and returns JSON responses.

## Base URL

All API requests should be made to the following base URL:

```
https://drive.futurixai.com
```

## Installing the SDK

You can interact with the API through HTTP requests from any language, or via our official SDKs.

### Python

To install the official Python SDK, run the following command:

```python
# pip install zerodrive

from zerodrive import ZeroDrive

client = ZeroDrive(api_key="zd_live_YOUR_API_KEY")
```

### Node.js

To install the official Node.js SDK, run the following command:

```javascript
// npm install zerodrive

import { ZeroDrive } from "zerodrive";

const client = new ZeroDrive({
  apiKey: "zd_live_YOUR_API_KEY",
});
```

## Response Format

All responses are returned in JSON format with the following structure:

```json
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

API requests are rate-limited to ensure fair usage across all users. Default limits vary by endpoint:

- **Standard endpoints**: 100 requests per minute
- **Upload endpoints**: 20 requests per minute
- **Bulk operations**: 10 requests per minute

Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

## Versioning

The API is versioned using a URL path prefix. The current version is `v1`. We recommend always specifying the version explicitly:

```
https://drive.futurixai.com/api/v1/files
```

## Next Steps

- [Authentication](/api-reference/authentication) - Learn how to authenticate your API requests
- [File Management](/api-reference/files/list) - Start managing files programmatically
- [Workspaces](/api-reference/workspaces/list) - Organize files with workspaces
