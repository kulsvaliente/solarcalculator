# Backend API Documentation

The frontend of this project communicates with a backend API, typically deployed at `https://arecgis-api.onrender.com/` (see `frontend/src/config/baseUrl.js`). The following outlines the main endpoints and their structure as inferred from the frontend code:

## Authentication

- `POST /auth`  
  Login with credentials (username and password).

- `POST /auth/logout`  
  Logs out the current user.

- `GET /auth/refresh`  
  Refreshes the access token.

- `POST /auth/verify`  
  Verifies a password.

## Users

- `GET /users`  
  Retrieves a list of users (requires authentication, data may be encrypted).

- `POST /users`  
  Adds a new user.

- `PATCH /users`  
  Updates user information.

## Blogs

- `GET /blogs`  
  Fetches all blogs.

- `POST /blogs`  
  Adds a new blog.

- `PATCH /blogs`  
  Updates a blog.

- `PUT /blogs`  
  Updates blog images.

- `DELETE /blogs/:id`  
  Deletes a blog by ID.

## Public Blogs

- `GET /publicBlogs`  
  Fetches blogs visible to the public.

## Inventories

- `GET /inventories`  
  Retrieves inventories (may be encrypted).

- `GET /inventory-list`  
  Get inventory list with query parameters for pagination and filtering.

- `POST /inventories`  
  Adds new inventory.

- `PATCH /inventories`  
  Updates inventory information.

## Public Inventories

- `GET /publicInventories`  
  Fetches inventories open to the public.

## Renergies

- `GET /renergies`  
  Fetches renewable energy resources.

## Transfers

- `GET /transfers`  
  Gets all transfers (admin).

- `GET /transfers/user`  
  Gets transfers for the logged-in user.

- `GET /transfers/:id`  
  Gets a specific transfer by ID.

- `PATCH /transfers/:id/approve`  
  Approves a transfer.

- `PATCH /transfers/:id/reject`  
  Rejects a transfer.

- `GET /transfers/check/:inventoryId`  
  Checks if there are existing transfers for a given inventory.

- `GET /transfers/:transferId/documents/:documentIndex`  
  Downloads a specific document as a blob.

## Notes

- Many responses are encrypted using AES and must be decrypted on the client.
- The backend API base URL may be set via environment variables (`REACT_APP_API_URL`).
- For details on expected request/response bodies, see the code in `frontend/src/features/*ApiSlice.js`.

---
