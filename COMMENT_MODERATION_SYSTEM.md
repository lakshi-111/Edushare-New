# Comment Reporting and Moderation System

## Overview
A comprehensive comment moderation system that allows students to report inappropriate comments and admins to review, edit, delete, or take action on reported content.

## Student-Side: Reporting Comments

### Report Button
Every comment on resource detail pages displays a small **Report button** (flag icon) next to the comment.
- Only visible to authenticated users
- Cannot report your own comments (button disabled if you're the author)
- Opens a report modal when clicked

### Report Modal
The report modal allows students to:
1. **Select a reason** from these options:
   - Incorrect or misleading information
   - Inappropriate language
   - Spam or advertising
   - Harassment or personal attack
   - Other

2. **Add optional details** (up to 500 characters) in a text box

3. **Submit the report**

### Report Restrictions
- **No self-reporting**: Students cannot report their own comments (validated on backend)
- **No duplicate reports**: Each student can only report the same comment once (validated on backend)
- Error messages shown if these restrictions are violated

### Report Submission Process
When a student submits a report:
1. Report is saved to Reports collection with:
   - Comment ID being reported
   - Reporter's user ID
   - Resource ID
   - Reason (enum value)
   - Description (optional)
   - Timestamp
   - Status: `pending`

2. If other reports exist for that comment, they're grouped together
3. Admin moderation dashboard counters update immediately
4. **Comment remains visible** until admin takes action

## Admin-Side: Moderation Dashboard

### Moderation Statistics Cards
Three cards at the top show live counts:
- **Reported Comments**: Count of unique comments with pending reports
- **Pending Inquiries**: Count of unresolved student inquiries
- **Total Alerts**: Sum of reported comments + pending inquiries

### Moderation Items List
Below the stats, a list displays moderation items grouped and sorted by most recent first:

Each reported comment shows:
- **Comment text** in quotes
- **Resource title** (what the comment was posted on)
- **Comment author** name
- **Report count** (how many students reported it)
- **Report reasons** (first 1-2 reports with their reasons and descriptions)
- **Timestamp** of the most recent report

When the list is empty, displays:
> No moderation items at this time.

### Most Reported Comment Alert
If there's a comment with multiple reports, a highlighted alert box shows the most reported comment with:
- Comment text
- Author and resource
- Total report count
- Quick "Delete Most Reported" button

## Admin-Side: Moderation Actions

### Four Actions Per Report

#### 1. **Dismiss Report**
- Button: Green checkmark icon
- Action: Marks report status as `dismissed`
- Result: Comment stays visible, counter decreases by 1
- Use case: Report was invalid/false alarm
- Admin can add internal note about decision

#### 2. **Edit Comment**
- Button: Blue edit/pencil icon
- Action: Opens modal to edit comment text directly
- Result: Admin modifies the offending part, comment preserved
- Status tracked: Comment marked as `edited`
- Admin can adjust offensive language while preserving useful content

#### 3. **Delete Comment**
- Button: Red trash/delete icon
- Action: Marks comment as deleted (soft delete with `isDeleted: true`)
- Also deletes all **replies** to that comment
- Result: Comment disappears from resource page
- Violations tracked: User's violation count incremented by 1
- Ban automatic: User banned if violation count reaches 3
- Reports auto-resolved: All reports on that comment marked as `resolved`

#### 4. **Warn User**
- Button: Orange mail/envelope icon
- Action: Sends automated warning email via Nodemailer
- Email contains:
  - Notification that a comment violated guidelines
  - Does NOT reveal who reported them
  - Warning about account suspension if it continues
- Result: User warned, can continue commenting
- No automatic action taken on comment or report

#### 5. **Ban User**
- Button: Dark red ban icon
- Action: Marks user account as `banned`
- Result: User cannot log in, appears as blocked
- One-time action: Can only ban after pattern of violations
- User data preserved: Account not deleted, just deactivated

## Database Schema

### Report Model
```javascript
{
  commentId: ObjectId (ref: Comment),
  resourceId: ObjectId (ref: Resource),
  reporterId: ObjectId (ref: User),  // Who reported it
  reason: String enum [
    'incorrect_or_misleading_information',
    'inappropriate_language',
    'spam_or_advertising',
    'harassment_or_personal_attack',
    'other'
  ],
  description: String (max 500 chars, optional),
  status: String enum ['pending', 'resolved', 'dismissed'],
  timestamp: Date,
  adminNote: String (optional)
}
```

### Comment Model (Updated)
Enhanced fields:
- `isDeleted`: Boolean (soft delete flag)
- `reportCount`: Number (count of reports on this comment)
- `editedContent`: String (original content if admin edited)
- `editedBy`: ObjectId (ref: User, admin who edited)
- `editedAt`: Date

### User Model (Updated)
Enhanced fields:
- `violationCount`: Number (moderation violation count)
- `strikes`: Number (also used for violations)
- `banned`: Boolean (account deactivated)
- `isBlocked`: Boolean (platform block - can be temporary)

## API Routes

### Student Routes
**POST /api/comments/:id/report**
- Protected: Yes (auth required)
- Request body:
  ```json
  {
    "reason": "incorrect_or_misleading_information",
    "description": "This information is actually outdated..."
  }
  ```
- Validates:
  - Comment exists and not deleted
  - Student cannot report own comment
  - Student hasn't already reported this comment
- Response: `{ message: "Comment reported successfully.", report }`

### Admin Routes (All Protected with Admin Role)

**GET /api/admin/moderation/stats**
- Returns three counter numbers
- Response:
  ```json
  {
    "reportedComments": 5,
    "pendingInquiries": 3,
    "totalAlerts": 8
  }
  ```

**GET /api/admin/moderation**
- Returns grouped moderation items
- Groups reports by comment ID
- Sorts by most recent first
- Response:
  ```json
  {
    "items": [
      {
        "type": "report",
        "commentId": "...",
        "resourceId": "...",
        "resourceTitle": "Study Guide PDF",
        "commentText": "This is outdated wrong info",
        "commentAuthor": "John Doe",
        "commentAuthorId": "...",
        "reportCount": 3,
        "reports": [
          {
            "id": "...",
            "reporter": "Jane Smith",
            "reason": "incorrect_or_misleading_information",
            "description": "This was updated last year",
            "createdAt": "2026-04-04T10:30:00Z"
          },
          ...
        ],
        "latestReportAt": "2026-04-04T10:30:00Z"
      },
      ...
    ],
    "topReportedComment": { ... }
  }
  ```

**PUT /api/admin/reports/:id/dismiss**
- Dismisses a report (no action taken on comment)
- Request body:
  ```json
  {
    "adminNote": "Reporter was mistaken about context"
  }
  ```
- Updates report status to `dismissed`

**PUT /api/admin/reports/:id/resolve**
- Marks report as resolved
- Used when action taken independently (via delete, etc.)
- Updates report status to `resolved`

**PUT /api/admin/comments/:id/edit**
- Admin edits the comment text directly
- Request body:
  ```json
  {
    "content": "This information was updated..."
  }
  ```
- Preserves comment with modified text
- Tracks: `editedBy`, `editedAt`, `editedContent`

**DELETE /api/admin/comments/:id**
- Deletes reported comment and all its replies
- Resolves ALL reports on that comment
- Increments user violation count
- Auto-bans user if violation count >= 3
- Response: `{ message: "Comment deleted and reports resolved." }`

**POST /api/admin/users/:id/warn**
- Sends warning email to user
- Includes comment violated guidelines
- Does not reveal reporter identity
- No changes to comment or user status

**PUT /api/admin/users/:id/ban**
- Marks user as banned
- User cannot log in
- Data preserved for audit trail

## Frontend Components

### CommentSection.jsx (`client/src/components/CommentSection.jsx`)
- Displays comments with report buttons
- Report modal with reason dropdown and description text area
- Handles report submission
- Shows error if already reported or own comment

### AdminModerationPage.jsx (`client/src/pages/admin/AdminModerationPage.jsx`)
- Statistics cards showing counters
- Moderation items list grouped by comment
- Action buttons for each report (dismiss, edit, delete, warn, ban)
- Edit comment modal
- Real-time data loading and updates

## Workflow Example

1. **Student Alice** reads a comment that says "This book was published in 1950" on a math resource
2. Alice clicks the report button next to the comment
3. Modal appears; she selects "Incorrect or misleading information"
4. She adds description: "This book was actually published in 2020"
5. Clicks "Submit Report"
6. Report saved; dashboard counter increments from 4 to 5

7. **Students Bob and Carol** also report the same comment for being outdated
8. Moderation dashboard now shows 3 reports grouped on the same comment
9. Comment count still shows 5 total reported comments (1 unique comment with 3 reports + 4 others)

10. **Admin Zara** opens moderation dashboard
11. Sees "3 reports" next to the outdated comment
12. Clicks the edit icon
13. Modal opens with comment text: "This book was published in 1950"
14. Zara edits to: "This book was published in 2020 (updated by mod)"
15. Saves changes
16. Comment now shows edited version; original saved in audit trail
17. All 3 reports automatically marked as resolved
18. Counter decreases from 5 to 4

## Abuse Prevention

### Three Rules Enforced at API Level

1. **Cannot Report Own Comments**
   ```javascript
   if (comment.userId === reporter.id) {
     return 403 Forbidden
   }
   ```

2. **Cannot Report Same Comment Twice**
   ```javascript
   const existing = Report.findOne({
     commentId, reporterId
   })
   if (existing) {
     return 400 "Already reported"
   }
   ```

3. **False Reports Flag User**
   - If admin determines a report is false, they can dismiss it
   - Admin can flag user in user management panel
   - Repeated false reporting can lead to restricted reporting privileges

### Counter-Abuse Features
- Track reporter ID for false report patterns
- Admin can manually flag spam reporters
- User reputation system (comment quality affects new report weight)
- High-quality reporters get priority in queue

## Security & Audit Trail

### Admin Log
Every action logged with:
- Admin ID and name
- Action taken (dismiss, delete, warn, ban)
- Comment and user involved
- Timestamp
- Admin notes (optional)

### Data Preservation
- Soft deletes preserve comment text
- Original comment content saved before edits
- Violation counts tracked for pattern analysis
- All reports kept (even dismissed) for audit

## Performance Optimizations

### Counters Query (GET /api/admin/moderation/stats)
Fast aggregation:
```javascript
Reports.countDocuments({ status: 'pending' })
Inquiries.countDocuments({ status: 'Pending' })
```

### Moderation Items (GET /api/admin/moderation)
- Group reports by comment
- Return only pending items
- Index on Status field for fast filtering
- Limit to recent items initially

## Testing Checklist

- [ ] Student can report comment with valid reason
- [ ] Cannot report own comment (shows error)
- [ ] Cannot report same comment twice (shows error)
- [ ] Report modal closes and confirms success
- [ ] Admin sees updated counter immediately
- [ ] Admin sees comment with report count
- [ ] Dismiss report decreases counter
- [ ] Edit comment updates text and resolves reports
- [ ] Delete comment: marks as deleted, resolves reports, increments violations
- [ ] Delete comment: auto-bans user after 3 violations
- [ ] Warn user: receives email notification
- [ ] Ban user: cannot log in
- [ ] "No moderation items" appears when empty
- [ ] Multiple reports grouped under same comment
- [ ] Most reported comment alert shows correctly
- [ ] Timestamps and author names display
- [ ] Reason text formatted correctly
