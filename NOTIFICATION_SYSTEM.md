# Notification System & Role-Based Access Documentation

## Overview
The IT/OT Collaboration Tool now includes a comprehensive notification system with role-based access control, providing real-time updates for seamless IT-OT collaboration.

## Key Features

### 1. Notification System
- **Real-time notifications** for all important events
- **Unread count badge** on notification bell
- **Click-to-navigate** directly to relevant request pages
- **Mark as read** functionality (individual or all)
- **Automatic triggers** for workflow events

### 2. Role-Based Access Control
- **IT Role**: Sees only requests they created + requests awaiting IT review
- **OT Role**: Sees only requests assigned to them
- **Admin Role**: Full access to all requests

### 3. Notification Types

| Type | Description | Triggered When | Recipient |
|------|-------------|----------------|-----------|
| `request_assigned` | New request assignment | IT creates and assigns request to OT | OT user |
| `status_changed` | Status update | Request status changes | IT or OT (context-dependent) |
| `new_comment` | New comment added | Either party adds a comment | Other party |
| `request_submitted` | Request submitted for review | OT submits completed request | IT user |

## Complete User Flow

### Scenario: IT Creates Request → OT Responds → IT Reviews

#### Step 1: IT Creates Request
1. **Login as IT user** (e.g., Maria Lopez)
2. **Navigate to Dashboard** - sees only their created requests
3. **Click "Create a request"**
4. **Select Asset** using UNS tree or manual form
5. **Fill request details**:
   - Description of data needed
   - Timeline
   - Estimated data points
6. **Assign to OT user** (e.g., Mike Johnson)
7. **Submit request**

**What happens:**
- Request created with status: `pending`
- Notification automatically sent to OT user
- Notification type: `request_assigned`
- Message: "Maria Lopez assigned you a new request for [Asset Name]"

#### Step 2: OT Receives Notification
1. **Switch to OT user** (e.g., Mike Johnson)
2. **See notification bell** with unread count badge (red)
3. **Click notification bell** to open dropdown
4. **View notification** (highlighted in blue = unread)
5. **Click notification** to navigate to request

**What happens:**
- Notification marked as read
- Redirected to `/request/[id]/respond`

#### Step 3: OT Configures Request
1. **Review IT's requirements** in request details
2. **Add comments** if clarification needed
   - Type message in comment box
   - Click "Send Message"

   **What happens:**
   - Comment added to conversation
   - Notification sent to IT user
   - Notification type: `new_comment`
   - IT sees unread badge on notification bell

3. **Configure connection details** (once globally):
   - Select protocol (Modbus TCP, OPC UA, MQTT, etc.)
   - Enter Host/IP address
   - Enter Port
   - Enter Machine Identifier

4. **Fill data point configurations**:
   - Each data point has specific fields based on protocol template
   - Example for Modbus TCP:
     - Metric Name
     - Register Address
     - Data Type
     - Operation
     - Unit

5. **Submit to IT for review**
   - Click "Submit to IT for Review"

   **What happens:**
   - Request status changes to `it-review`
   - Notification sent to IT user
   - Notification type: `request_submitted`
   - Message: "Mike Johnson submitted [Asset Name] for your review"

#### Step 4: IT Reviews Configuration
1. **Switch back to IT user** (Maria Lopez)
2. **See notification** about submission
3. **Click notification** to navigate to review page
4. **Review OT's configuration**:
   - Connection details
   - Data point mappings
   - All conversation history

5. **Take action**:
   - **If changes needed**: Change status to `blocked` or `discussion-active`
     - Add comment explaining what needs to change
     - OT receives notification

   - **If approved**: Change status to `complete`
     - Request is now ready for export/AI processing

**What happens on status change:**
- Notification sent to relevant party
- Notification type: `status_changed`
- Notification link directs to appropriate page

## Implementation Details

### Files Modified

#### 1. `/src/types.ts`
Added notification types:
```typescript
export type NotificationType =
  | 'request_created'
  | 'request_assigned'
  | 'status_changed'
  | 'new_comment'
  | 'request_submitted'
  | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  requestId: string;
  requestName: string;
  message: string;
  from: string;
  to: string;
  timestamp: string;
  read: boolean;
  link: string;
}
```

#### 2. `/src/context/AppContext.tsx`
Implemented notification logic:
- `addNotification()` - Add custom notification
- `markNotificationRead(id)` - Mark single notification as read
- `markAllNotificationsRead()` - Mark all current user's notifications as read

**Automatic Triggers:**
- `addRequest()` - Creates notification for OT assignment
- `updateRequest()` - Creates notification for status changes
- `addMessage()` - Creates notification for new comments

#### 3. `/src/components/Layout.tsx`
Created notification UI:
- Bell icon with unread count badge
- Dropdown panel with notification list
- Color-coded notification types
- Click-to-navigate functionality
- Mark all as read button

#### 4. `/src/pages/Dashboard.tsx`
Implemented role-based filtering:
```typescript
const matchesRole =
  currentUser.role === 'Admin' ? true : // Admin sees all
  currentUser.role === 'IT' ? (req.createdBy === currentUser.name || req.status === 'it-review') : // IT sees created or review
  currentUser.role === 'OT' ? req.assignedTo === currentUser.name : // OT sees assigned
  false;
```

## Notification Visual Design

### Notification Bell
- **Location**: Header, between user switcher and admin settings
- **Badge**: Red circle with white text showing unread count
- **Badge text**: Shows "9+" if more than 9 unread

### Notification Dropdown
- **Width**: 384px (w-96)
- **Max Height**: 600px with scroll
- **Header**: Title + "Mark all read" button + close button
- **Empty State**: Bell icon with "No notifications yet" message

### Notification Items
- **Unread**: Blue background (bg-blue-50) + blue dot indicator
- **Read**: White background
- **Hover**: Gray background (hover:bg-gray-50)

**Color Coding by Type:**
| Type | Icon Background | Icon Text |
|------|----------------|-----------|
| request_assigned | bg-blue-100 | text-blue-600 |
| status_changed | bg-yellow-100 | text-yellow-600 |
| new_comment | bg-green-100 | text-green-600 |
| request_submitted | bg-purple-100 | text-purple-600 |

## Testing the Flow

### Test Case 1: Full IT → OT → IT Cycle
1. Login as **Maria Lopez (IT)**
2. Create new request for "Temperature Control Unit"
3. Assign to **Mike Johnson (OT)**
4. Switch to **Mike Johnson (OT)**
5. Verify notification appears with red badge
6. Click notification → verify navigates to respond page
7. Add comment "What sample rate do you need?"
8. Switch to **Maria Lopez (IT)**
9. Verify notification for comment appears
10. Click notification → respond to comment
11. Switch back to **Mike Johnson (OT)**
12. Configure connection and data points
13. Submit to IT for review
14. Switch to **Maria Lopez (IT)**
15. Verify notification for submission appears
16. Click notification → review configuration
17. Complete the request

### Test Case 2: Role-Based Filtering
1. Login as **Maria Lopez (IT)**
2. Dashboard shows only:
   - Requests created by Maria
   - Requests with status `it-review` (regardless of creator)
3. Login as **Mike Johnson (OT)**
4. Dashboard shows only:
   - Requests assigned to Mike
5. Login as **Admin**
6. Dashboard shows all requests

### Test Case 3: Notification Types
1. **Assignment**: IT assigns → OT gets notification
2. **Comment**: Either party comments → Other party gets notification
3. **Status Change**:
   - OT submits (`status: it-review`) → IT gets notification
   - IT blocks → OT gets notification
   - IT starts discussion → OT gets notification
4. **Submission**: OT submits for review → IT gets notification

## Edge Cases Handled

### 1. Notification Filtering
- Users only see notifications addressed to them (`to === currentUser.name`)
- Other users' notifications remain private

### 2. Click Outside Dropdown
- Dropdown closes automatically when clicking outside
- Uses `useRef` and `useEffect` for cleanup

### 3. Navigation After Notification Click
- Notification marked as read before navigation
- Dropdown closes automatically
- User navigates to correct page based on notification link

### 4. Unread Count Display
- Shows actual count up to 9
- Shows "9+" for 10 or more unread notifications

### 5. Timestamp Formatting
- "Just now" for < 1 minute
- "X mins ago" for < 1 hour
- "X hours ago" for < 24 hours
- "X days ago" for < 7 days
- Full date (e.g., "Jan 5") for older notifications

## Architecture Benefits

### 1. Automatic Notification Generation
- No manual `addNotification()` calls needed in components
- Notifications automatically created in AppContext methods
- Reduces code duplication and potential bugs

### 2. Centralized State Management
- All notification logic in AppContext
- Single source of truth for notifications
- Easy to extend with new notification types

### 3. Loosely Coupled Components
- Layout component handles UI only
- Dashboard handles filtering only
- AppContext handles business logic only
- Clear separation of concerns

### 4. Type Safety
- All notification types defined in TypeScript
- Compile-time checking prevents invalid notification types
- IntelliSense support for notification properties

## Future Enhancements

### Potential Features
1. **Notification Preferences**
   - Allow users to mute certain notification types
   - Email notifications for critical events
   - Desktop push notifications

2. **Notification History**
   - Archive old notifications
   - Search through notification history
   - Export notification log

3. **Batch Actions**
   - Delete all read notifications
   - Filter notifications by type
   - Sort by date/type/priority

4. **Real-time Updates**
   - WebSocket integration for instant notifications
   - No page refresh required
   - Multi-device synchronization

5. **Notification Grouping**
   - Group multiple status changes for same request
   - Collapse similar notifications
   - "5 new comments" summary

## Summary

✅ **Notification System**: Fully implemented with automatic triggers
✅ **Role-Based Access**: IT, OT, and Admin views properly filtered
✅ **User Flow**: Complete IT → OT → IT workflow with notifications
✅ **Visual Design**: JIRA-inspired, clean notification UI
✅ **Type Safety**: All types properly defined in TypeScript
✅ **Build Status**: Successful (286KB JS, 24KB CSS)

The notification system provides a seamless, JIRA-like collaboration experience while maintaining the core IT/OT workflow for machine integration data collection.
