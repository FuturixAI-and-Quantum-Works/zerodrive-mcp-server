# API Documentation Guide for Backend Engineers

This guide explains how to document new API endpoints for the ZeroDrive API documentation system.

## File Structure

Each endpoint requires **two JSON files**:

```
lib/api-docs/
├── {category}/
│   └── {endpoint}/
│       ├── route.json      # Endpoint definition (required)
│       └── examples.json   # Request/response examples (required)
```

### Example Structure

```
lib/api-docs/
├── files/
│   ├── list/
│   │   ├── route.json
│   │   └── examples.json
│   ├── get/
│   │   ├── route.json
│   │   └── examples.json
│   └── upload/
│       ├── route.json
│       └── examples.json
├── folders/
│   └── ...
└── workspaces/
    └── ...
```

---

## route.json Schema

### Required Fields

| Field       | Type   | Description                                |
| ----------- | ------ | ------------------------------------------ |
| `meta`      | object | Metadata about the endpoint                |
| `endpoint`  | object | HTTP method and path                       |
| `auth`      | object | Authentication requirements                |
| `request`   | object | Request parameters (headers, params, body) |
| `responses` | object | Success and error responses                |

### Optional Fields

| Field       | Type   | Description                 |
| ----------- | ------ | --------------------------- |
| `rateLimit` | object | Rate limiting configuration |

### Complete Schema

```json
{
  "meta": {
    "title": "string (required)",
    "description": "string (required)",
    "category": "string (required)",
    "categorySlug": "string (required)"
  },
  "endpoint": {
    "method": "GET | POST | PATCH | PUT | DELETE (required)",
    "path": "string (required)",
    "baseUrl": "string (optional, defaults to drive.futurixai.com)"
  },
  "auth": {
    "required": "boolean (required)",
    "type": "bearer | apiKey | basic | oauth2 (optional)",
    "scopes": ["string"] // optional array of required scopes
  },
  "rateLimit": {
    "requests": "number",
    "window": "string (e.g., '1m', '1h')"
  },
  "request": {
    "headers": [...],
    "pathParams": [...],
    "queryParams": [...],
    "body": {...}
  },
  "responses": {
    "success": [...],
    "errors": [...]
  }
}
```

---

## Parameter Schema

Parameters are used in `headers`, `pathParams`, and `queryParams` arrays.

```json
{
  "name": "string (required)",
  "type": "string (required) - e.g., string, integer, boolean, array",
  "required": "boolean (required)",
  "description": "string (optional)",
  "default": "any (optional)",
  "example": "any (optional)",
  "enum": ["string"] // optional - allowed values
  "pattern": "string (optional) - regex pattern",
  "minimum": "number (optional)",
  "maximum": "number (optional)",
  "minLength": "number (optional)",
  "maxLength": "number (optional)",
  "nullable": "boolean (optional)"
}
```

### Example Parameter

```json
{
  "name": "sortBy",
  "type": "string",
  "required": false,
  "description": "Field to sort results by",
  "enum": ["createdAt", "updatedAt", "name"],
  "default": "createdAt"
}
```

---

## Body Schema

For POST, PUT, PATCH requests with JSON bodies:

```json
{
  "body": {
    "contentType": "application/json | multipart/form-data (required)",
    "required": "boolean (optional, defaults to false)",
    "schema": {
      "type": "object",
      "properties": {
        "fieldName": {
          "type": "string | integer | boolean | array | object",
          "required": "boolean",
          "description": "string",
          "nullable": "boolean (optional)",
          "minLength": "number (optional)",
          "maxLength": "number (optional)",
          "items": { "type": "string" } // for arrays
        }
      }
    }
  }
}
```

---

## Response Schema

### Success Responses

```json
{
  "success": [
    {
      "status": 200,
      "statusText": "OK",
      "description": "Successfully retrieved resource",
      "contentType": "application/json",
      "schema": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean" },
          "data": { ... }
        }
      }
    }
  ]
}
```

### Error Responses

```json
{
  "errors": [
    {
      "status": 400,
      "statusText": "Bad Request",
      "description": "Invalid request body or parameters"
    },
    {
      "status": 401,
      "statusText": "Unauthorized",
      "description": "Missing or invalid authentication"
    }
  ]
}
```

---

## examples.json Schema

```json
{
  "request": {
    "curl": "string (required) - Full curl command",
    "body": { ... } // optional - JSON body for POST/PUT/PATCH
  },
  "response": { ... } // optional - Example success response body
}
```

### Example

```json
{
  "request": {
    "curl": "curl -X POST 'https://drive.futurixai.com/api/files/upload' \\\n  -H 'Authorization: Bearer YOUR_TOKEN' \\\n  -F 'file=@document.pdf'",
    "body": {
      "folderId": "folder_xyz"
    }
  },
  "response": {
    "success": true,
    "data": {
      "id": "file_abc123",
      "name": "document.pdf",
      "size": 1024000
    }
  }
}
```

---

## Adding a New Endpoint

### Step 1: Create the directory

```bash
mkdir -p lib/api-docs/{category}/{endpoint}
```

### Step 2: Copy templates

```bash
cp lib/api-docs/_templates/route.template.json lib/api-docs/{category}/{endpoint}/route.json
cp lib/api-docs/_templates/examples.template.json lib/api-docs/{category}/{endpoint}/examples.json
```

### Step 3: Edit the files

1. Update `route.json` with your endpoint's specification
2. Update `examples.json` with realistic examples

### Step 4: Register the endpoint

Add imports to `lib/api-endpoints.ts`:

```typescript
// Add route import
import newEndpoint from "./api-docs/{category}/{endpoint}/route.json";

// Add examples import
import newEndpointExamples from "./api-docs/{category}/{endpoint}/examples.json";

// Add to endpoints object
export const endpoints: Record<string, ApiEndpointData> = {
  // ... existing endpoints
  "{category}/{endpoint}": combineEndpointData(
    newEndpoint as RouteData,
    newEndpointExamples as ApiExamplesFile
  ),
};
```

### Step 5: Update navigation (optional)

If this is a new endpoint category, update `lib/docs-navigation.ts`.

---

## Common Categories

| Category          | categorySlug | Description                 |
| ----------------- | ------------ | --------------------------- |
| File Management   | files        | File CRUD operations        |
| Folder Management | folders      | Folder operations           |
| Workspace         | workspaces   | Workspace management        |
| Authentication    | auth         | Login, logout, tokens       |
| User              | users        | User profile management     |
| Sharing           | sharing      | Share links and permissions |

---

## Best Practices

1. **Be descriptive** - Write clear descriptions for endpoints and parameters
2. **Include examples** - Provide realistic example values
3. **Document all errors** - List all possible error responses
4. **Use consistent naming** - Follow existing conventions for field names
5. **Add enum values** - When a field has limited options, use `enum`
6. **Specify defaults** - Document default values for optional parameters
7. **Keep curl examples working** - Test that curl commands actually work

---

## Template Files

- `_templates/route.template.json` - Complete route.json template with all fields
- `_templates/examples.template.json` - Examples template

Copy these and modify for each new endpoint.
