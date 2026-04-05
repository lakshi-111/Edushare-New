# Admin User Management Implementation

## Overview
This document describes the implementation of admin user management features that allow administrators to view, add, and delete user accounts with proper cascading deletion and audit logging.

## Features Implemented

### 1. View All Users
**Endpoint:** `GET /api/admin/users`
- **Protected:** Yes (requires admin role)
- **Parameters:**
  - `q` or `search`: Search by name, email, or student ID
  - `role`: Filter by role (student/admin)
  - `faculty`: Filter by faculty
  - `year`: Filter by academic year
  - `ratingBadge`: Filter by rating badge tier
- **Response:** Returns list of users with statistics
  ```json
  {
    "users": [...],
    "stats": {
      "totalUsers": 0,
      "totalAdmins": 0,
      "blockedUsers": 0,
      "activeUsers": 0
    }
  }
  ```

### 2. Add New User
**Endpoint:** `POST /api/admin/users`
- **Protected:** Yes (requires admin role)
- **Request Body:**
  ```json
  {
    "name": "Student Name",
    "email": "student@example.com",
    "password": "SecurePass123!",
    "studentIdNumber": "STU12345",
    "faculty": "Engineering",
    "year": "Year 2",
    "role": "student"  // or "admin"
  }
  ```
- **Validation:**
  - Name: Minimum 2 characters
  - Email: Valid email format
  - Password: Minimum 8 characters, must include uppercase, lowercase, number, and special character
  - Role: Must be 'student' or 'admin'
- **Process:**
  1. Validates email uniqueness
  2. Hashes password using bcrypt
  3. Creates user record
  4. Sends welcome email with credentials
  5. Logs action to AdminLog
- **Response:** Returns created user (without password)

### 3. Delete User
**Endpoint:** `DELETE /api/admin/users/:id`
- **Protected:** Yes (requires admin role)
- **Safety Checks:**
  - Admin cannot delete their own account
  - Confirmation required in frontend
- **Cascading Delete:**
  - ✓ Deletes all ratings given by the user
  - ✓ Deletes all ratings on user's resources
  - ✓ Deletes all comments on user's resources
  - ✓ Deletes all comments from the user
  - ✓ Deletes all inquiries from the user
  - ✓ Deletes all orders for the user
  - ✓ Deletes all notifications for the user
  - ✓ Disconnects all user connections
  - ✓ **Anonymizes** user's resources (marks as uploaderDeleted = true)
  - ✓ Deletes the user account
- **Transaction Safety:** Uses MongoDB transactions to ensure all-or-nothing deletion
- **Logging:** Records deletion action to AdminLog with admin ID and timestamp

## Frontend Component

### AdminUsersPage.jsx
Located at: `client/src/pages/admin/AdminUsersPage.jsx`

**Features:**
- Search users by name, email, or student ID
- Filter by role, faculty, academic year, and rating badge
- View user statistics (total, admins, blocked, active)
- Add new user form with validation feedback
- Delete user with confirmation prompt
- Real-time table updates

**Form Fields:**
- Full name (required)
- Email address (required)
- Password (required, validated)
- Student ID (optional)
- Faculty (optional)
- Academic year (optional)
- Role (defaults to student)

## Database Changes

### Resource Model Update
Added `uploaderDeleted` flag to track when a resource's uploader has been deleted:
```javascript
uploaderDeleted: { type: Boolean, default: false }
```

When a user is deleted, their resources are marked with `uploaderDeleted: true` instead of being deleted, allowing existing purchases to remain valid.

### AdminLog Records
All admin actions are logged with:
- adminId: The admin performing the action
- targetUserId: The user being acted upon
- action: Type of action (create_user, delete_user)
- description: Human-readable description
- timestamp: Automatic timestamp

## Frontend Handling of Deleted Uploaders

### ResourceDetailPage.jsx
Shows "Deleted User" with appropriate messaging when `uploaderDeleted` is true:
```jsx
{resource.uploaderDeleted ? (
  <>
    <p className="font-semibold text-slate-600">Uploaded by Deleted User</p>
    <p className="text-sm text-slate-400">This user's account has been removed</p>
  </>
) : (
  <>
    <p className="font-semibold text-slate-900">Uploaded by {resource.uploaderId?.name}</p>
    {/* ... other uploader info ... */}
  </>
)}
```

### StudentPerformancePage.jsx
Includes deleted users in analytics with "Deleted User" placeholder in top contributors list.

## API Routes Protection

All endpoints are protected with:
1. `auth` middleware: Verifies user JWT token
2. `requireAdmin` middleware: Verifies user has admin role

Unauthorized access returns 403 Forbidden.

## Field Name Standardization

The implementation uses the following field names throughout (consistent with existing student registration):
- `studentIdNumber`: Student ID field
- `year`: Academic year field
- `faculty`: Faculty/Department
- `semester`: Semester information

These match the User model schema exactly.

## Security Considerations

1. **Password Hashing:** All passwords are hashed with bcrypt before storage (never stored in plain text)
2. **Admin Protection:** Admins cannot delete their own accounts from the dashboard
3. **Transaction Safety:** Delete operations use MongoDB transactions to prevent partial deletions
4. **Audit Trail:** All actions logged with admin identity and timestamp
5. **Email Security:** Welcome emails contain credentials but should encourage immediate password change
6. **Validation:** All input is validated server-side with express-validator

## Testing Checklist

- [ ] Add new student user and verify welcome email sent
- [ ] Add new admin user and verify role is set correctly
- [ ] Search users by name, email, and student ID
- [ ] Filter users by role, faculty, year, and badge
- [ ] Delete user and verify:
  - [ ] AdminLog entry created
  - [ ] All user data removed
  - [ ] User's resources marked as uploaderDeleted
  - [ ] Purchased resources still accessible to buyers
  - [ ] Uploader name shows as "Deleted User"
- [ ] Verify admin cannot delete own account
- [ ] Verify non-admin users cannot access endpoints
- [ ] Test password validation on new user creation
- [ ] Test email uniqueness validation

## Error Handling

API responses follow this pattern:
```json
{
  "message": "Human-readable message",
  "errors": [  // Optional, for validation errors
    { "param": "fieldName", "msg": "Error message" }
  ]
}
```

Common errors:
- 400: Validation failed (see errors array)
- 403: Not authorized/not admin
- 404: User not found
- 409: Email already exists
