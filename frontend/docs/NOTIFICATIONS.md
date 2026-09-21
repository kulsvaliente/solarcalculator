# Notification System

## Overview
The notification system provides real-time updates for request status changes in the AREC GIS application. It displays different notifications based on user roles and request statuses.

## Features

### Role-Based Notifications
- **Admin/Manager**: See pending requests that require their attention
- **Installer/Employee**: See updates on their own requests (approved/rejected)
- **Other Users**: See their own request updates

### Notification Display
- Shows maximum of 3 notifications at a time
- Real-time updates with 30-second polling
- Click on notification to view full request details
- "View All Requests" button for pagination

### Visual Indicators
- Badge showing number of unread notifications
- Color-coded status chips (pending, approved, rejected)
- Icons for different request types (transfer, account deletion)
- Time ago formatting for better UX

## Backend API

### Endpoint
```
GET /requests/notifications
```

### Response Format
```json
{
  "notifications": [
    {
      "id": "request_id",
      "requestType": "transfer|account_deletion",
      "status": "pending|approved|rejected",
      "reason": "Request reason",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "requesterName": "John Doe",
      "inventoryName": "Solar Panel 001",
      "inventoryLocation": "Location A",
      "reviewedByName": "Admin User",
      "reviewDate": "2024-01-01T00:00:00.000Z",
      "notes": "Admin notes",
      "rejectionReason": "Reason for rejection"
    }
  ],
  "total": 3,
  "hasMore": true
}
```

## Frontend Components

### NotificationBell Component
- Located at `src/components/NotificationBell.js`
- Integrated into `DashHeader.js`
- Uses Material-UI components for consistent styling
- Handles click events and navigation

### API Integration
- Uses RTK Query for data fetching
- Automatic cache invalidation on request updates
- Polling for real-time updates

## Usage

### For Users
1. Click the notification bell icon in the header
2. View your notifications in the dropdown
3. Click on any notification to view full details
4. Use "View All Requests" to see paginated results

### For Developers
1. Import `NotificationBell` component
2. Add to your header/navbar component
3. Ensure user has proper role permissions
4. Backend automatically filters notifications by role

## Configuration

### Polling Interval
- Default: 30 seconds
- Configurable in `requestsApiSlice.js`

### Notification Limit
- Default: 3 notifications
- Configurable in backend controller

### Role Permissions
- Admin/Manager: Can see all pending requests
- Installer/Employee: Can see their own request updates
- Other roles: Can see their own requests

## Styling
- Uses Material-UI theme system
- Responsive design for mobile and desktop
- Consistent with application design language
- Hover effects and smooth transitions

## Error Handling
- Graceful fallback for API errors
- Loading states for better UX
- Empty state when no notifications
- Automatic retry on network issues

