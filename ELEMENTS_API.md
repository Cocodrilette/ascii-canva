# 📄 Elements API Documentation (Agent-Friendly)

This document provides technical details for using the `ascii_canva` Elements API. It is specifically designed for AI Agents to understand the endpoints, authentication, and data structures required to programmatically manipulate ASCII art spaces.

---

## 🛠 Endpoint Overview

**Base URL:** `/api/spaces/[id]/elements`
**Method:** `POST` (Only)

The `[id]` path parameter can be either the **UUID** of the space or its unique **Slug**.

---

## 🔐 Authentication & Authorization

All requests MUST include an API Key in the headers.

| Header Name | Type | Description |
| :--- | :--- | :--- |
| `x-api-key` | `string` | A valid, active API Key associated with your account. |

**Note:** You can only modify spaces that you own.

### 🛡 Secure Credential Handling
Users should provide their API keys to AI agents through secure channels. 
- **Recommendation:** Do not paste your API key directly into chat prompts if they are logged or public.
- **Best Practice:** Use environment variables (e.g., `ASCII_CANVA_API_KEY`) or secure secret managers when configuring agents for autonomous work.

---

## 🔑 How to Get an API Key

If you do not have an API key, or your current one has expired, follow these steps within the application:

1.  **Open the Manager**: Click on the **Key icon** (or look for `API_KEY_MANAGER.EXE`) in the application interface (usually found in the Space settings or Taskbar).
2.  **Identity Verification**: If you are not logged in, you will be prompted to verify your identity via the **Auth Modal**.
3.  **Generate Key**:
    -   Enter a descriptive name for your key (e.g., "My AI Assistant").
    -   Click the **Create** button.
4.  **Copy & Save**: The key (starting with `ac_`) will be shown **ONLY ONCE**. Copy it immediately and store it in a secure location.
5.  **Revocation**: You can return to this manager at any time to revoke keys if they are compromised.

---

## 📤 Request Payload

The API expects a JSON body with the following structure:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | `string` | Yes | The type of ASCII element (see "Available Types" below). |
| `x` | `number` | Yes | The horizontal coordinate (column) for the element's origin. |
| `y` | `number` | Yes | The vertical coordinate (row) for the element's origin. |
| `params`| `object` | No | Extension-specific parameters. |

---

## 🧩 Available Types & Parameters

### 1. `box`
Draws a rectangular border with `+`, `-`, and `|`.
- `width` (number, default: 10): Total width including borders.
- `height` (number, default: 5): Total height including borders.

### 2. `line`
Draws an orthogonal line (elbow joint) between points.
- `x2` (number): End X coordinate (shortcut for simple lines).
- `y2` (number): End Y coordinate (shortcut for simple lines).
- `points` (Array<{x: number, y: number}>): Custom multi-point path.

### 3. `text`
Draws raw text. Supports multi-line with `\n`.
- `text` (string): The content to display.

### 4. `vector`
An orthogonal line with an arrowhead (`>`, `<`, `v`, `^`) at the end.
- `x2` (number): Tip X coordinate.
- `y2` (number): Tip Y coordinate.
- `points` (Array<{x: number, y: number}>): Custom path ending in an arrow.

---

## 📥 Response Format

### ✅ Success (201 Created)
```json
{
  "success": true,
  "element": {
    "id": "element-uuid",
    "space_id": "space-uuid",
    "type": "box",
    "x": 10,
    "y": 5,
    "params": { "width": 10, "height": 5 }
  }
}
```

### ❌ Errors
- `401 Unauthorized`: API Key missing or invalid.
- `403 Forbidden`: API Key revoked or you do not own the space.
- `404 Not Found`: The specified space (UUID or Slug) does not exist.
- `400 Bad Request`: Missing required fields (`type`, `x`, `y`).

---

## 💡 AI Agent Tips & Examples

### Example: Drawing a Flowchart Node
```bash
curl -X POST "http://localhost:3000/api/spaces/my-space/elements" \
     -H "x-api-key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "box",
       "x": 5, "y": 2,
       "params": { "width": 14, "height": 3 }
     }'

curl -X POST "http://localhost:3000/api/spaces/my-space/elements" \
     -H "x-api-key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "text",
       "x": 7, "y": 3,
       "params": { "text": "PROCESS" }
     }'
```

### Strategy for Drawing
1. **Coordinates:** `x` is columns, `y` is rows. `(0,0)` is top-left.
2. **Layering:** Elements are rendered in order of creation.
3. **Collision:** The API does check for overlaps; elements will overwrite each other in the final ASCII export if they occupy the same cells.
