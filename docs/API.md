# API Documentation

Complete REST API reference for Subly.

## Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Authentication Endpoints](#authentication-endpoints)
- [Subscription Endpoints](#subscription-endpoints)
- [Calendar Endpoints](#calendar-endpoints)
- [Invitation Endpoints](#invitation-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Push Notification Endpoints](#push-notification-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## API Overview

**Base URL:** `http://localhost:5071/api` (development)

**Content-Type:** `application/json`

**Authentication:** JWT Bearer token (except public endpoints)

### API Versioning

Currently: v1 (implicit, no version in URL)

### Response Format

Success response:
```json
{
  "message": "Success message",
  "data": { ... }
}
```

Error response:
```json
{
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Authorization Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Token

Login or register to receive a JWT token:

```bash
POST /api/auth/login
POST /api/auth/register
```

Token is valid for 30 days.

### Example Request

```bash
curl -X GET http://localhost:5071/api/subscriptions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Authentication Endpoints

### Register User

Create a new user account with invitation code.

**Endpoint:** `POST /api/auth/register`

**Authentication:** None (public)

**Rate Limit:** 3 requests per hour per IP

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "invitationCode": "ABC123"
}
```

**Validation:**
- `username`: min 3 characters
- `email`: valid email format
- `password`: min 12 characters, must contain uppercase, lowercase, and number
- `invitationCode`: valid and unused invitation code

**Response:** `201 Created`
```json
{
  "_id": "65f1234567890abcdef12345",
  "username": "john_doe",
  "email": "john@example.com",
  "emailVerified": false,
  "emailNotifications": true,
  "pushNotificationsEnabled": false,
  "paymentReminderDays": 3,
  "language": "en",
  "role": "user",
  "currency": "EUR",
  "theme": "dark",
  "monthlyRevenue": 0,
  "annualRevenue": 0,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400`: Invalid input data
- `404`: Invalid invitation code
- `500`: Server error

---

### Login User

Authenticate user and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Authentication:** None (public)

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "_id": "65f1234567890abcdef12345",
  "username": "john_doe",
  "email": "john@example.com",
  "emailVerified": true,
  "emailNotifications": true,
  "pushNotificationsEnabled": false,
  "paymentReminderDays": 3,
  "language": "en",
  "role": "user",
  "currency": "EUR",
  "theme": "dark",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401`: Invalid credentials
- `403`: Account deactivated
- `500`: Server error

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "_id": "65f1234567890abcdef12345",
  "username": "john_doe",
  "email": "john@example.com",
  "emailVerified": true,
  "emailNotifications": true,
  "pushNotificationsEnabled": false,
  "paymentReminderDays": 3,
  "language": "en",
  "role": "user",
  "currency": "EUR",
  "theme": "dark",
  "monthlyRevenue": 0,
  "annualRevenue": 0,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

### Update Password

Change user password.

**Endpoint:** `PUT /api/auth/password`

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Validation:**
- `newPassword`: min 12 characters, must contain uppercase, lowercase, and number

**Response:** `200 OK`
```json
{
  "message": "Password updated successfully"
}
```

---

### Update Email

Change user email address.

**Endpoint:** `PUT /api/auth/email`

**Authentication:** Required

**Request Body:**
```json
{
  "email": "newemail@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email updated successfully. Please check your inbox to verify your email.",
  "email": "newemail@example.com",
  "emailVerified": false
}
```

**Note:** Email verification status is reset and verification email is sent.

---

### Verify Email

Verify email address with token from email.

**Endpoint:** `GET /api/auth/verify-email/:token`

**Authentication:** None (public)

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully!"
}
```

**Errors:**
- `400`: Invalid or expired token

---

### Resend Verification Email

Request new verification email.

**Endpoint:** `POST /api/auth/resend-verification`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Verification email sent successfully"
}
```

---

### Update Notification Preferences

Enable/disable email notifications.

**Endpoint:** `PUT /api/auth/notifications`

**Authentication:** Required

**Request Body:**
```json
{
  "emailNotifications": true
}
```

**Response:** `200 OK`
```json
{
  "message": "Notification preferences updated successfully",
  "emailNotifications": true
}
```

---

### Update Revenue

Set user's monthly and annual revenue.

**Endpoint:** `PUT /api/auth/revenue`

**Authentication:** Required

**Request Body:**
```json
{
  "monthlyRevenue": 5000,
  "annualRevenue": 60000
}
```

**Response:** `200 OK`
```json
{
  "message": "Revenue updated successfully",
  "monthlyRevenue": 5000,
  "annualRevenue": 60000
}
```

---

### Update Preferences

Update user preferences (theme, language, currency, notifications).

**Endpoint:** `PUT /api/auth/preferences`

**Authentication:** Required

**Request Body:**
```json
{
  "pushNotificationsEnabled": true,
  "paymentReminderDays": 7,
  "language": "fr",
  "currency": "USD",
  "theme": "dracula"
}
```

**Validation:**
- `paymentReminderDays`: 1, 3, or 7
- `language`: 'en' or 'fr'
- `currency`: 'EUR' or 'USD'
- `theme`: 'dark', 'light', 'dracula', 'nord', or 'solarized'

**Response:** `200 OK`
```json
{
  "message": "Preferences updated successfully",
  "pushNotificationsEnabled": true,
  "paymentReminderDays": 7,
  "language": "fr",
  "currency": "USD",
  "theme": "dracula"
}
```

## Subscription Endpoints

### Get All Subscriptions

Get all subscriptions for authenticated user.

**Endpoint:** `GET /api/subscriptions`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "_id": "65f1234567890abcdef12345",
    "user": "65f1234567890abcdef12345",
    "name": "Netflix",
    "amount": 15.99,
    "billingCycle": "monthly",
    "category": "Entertainment",
    "startDate": "2025-01-01T00:00:00.000Z",
    "nextBillingDate": "2025-02-01T00:00:00.000Z",
    "isActive": true,
    "isTrial": false,
    "isShared": false,
    "notes": "Premium plan",
    "iconFilename": "netflix_icon.png",
    "notificationSent": false,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
]
```

---

### Get Subscription Statistics

Get spending statistics for authenticated user.

**Endpoint:** `GET /api/subscriptions/stats`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "totalMonthly": 125.50,
  "totalMonthlyOnly": 85.50,
  "totalAnnual": 480.00,
  "totalYearly": 1506.00,
  "count": 12,
  "byCategory": {
    "Entertainment": 45.99,
    "Productivity": 35.00,
    "Cloud Storage": 25.00,
    "Other": 19.51
  }
}
```

**Fields:**
- `totalMonthly`: Total monthly cost (including annual subscriptions / 12)
- `totalMonthlyOnly`: Only pure monthly subscriptions
- `totalAnnual`: Total annual subscriptions cost
- `totalYearly`: Projected yearly cost (totalMonthly × 12)
- `count`: Number of active subscriptions
- `byCategory`: Breakdown by category

---

### Create Subscription

Add a new subscription.

**Endpoint:** `POST /api/subscriptions`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Spotify",
  "amount": 9.99,
  "billingCycle": "monthly",
  "category": "Entertainment",
  "startDate": "2025-01-15",
  "nextBillingDate": "2025-02-15",
  "isActive": true,
  "isTrial": false,
  "isShared": false,
  "notes": "Individual plan"
}
```

**Validation:**
- `name`: required, non-empty
- `amount`: required, positive number
- `billingCycle`: 'monthly' or 'annual'
- `nextBillingDate`: required, valid ISO8601 date

**Optional fields:**
- `category`: string
- `startDate`: ISO8601 date
- `isTrial`: boolean
- `trialEndDate`: ISO8601 date
- `isShared`: boolean
- `sharedBy`: number (people sharing)
- `notes`: string
- `iconFilename`: string

**Response:** `201 Created`
```json
{
  "_id": "65f1234567890abcdef67890",
  "user": "65f1234567890abcdef12345",
  "name": "Spotify",
  "amount": 9.99,
  "billingCycle": "monthly",
  "category": "Entertainment",
  "startDate": "2025-01-15T00:00:00.000Z",
  "nextBillingDate": "2025-02-15T00:00:00.000Z",
  "isActive": true,
  "isTrial": false,
  "isShared": false,
  "notes": "Individual plan",
  "notificationSent": false,
  "createdAt": "2025-01-15T12:00:00.000Z",
  "updatedAt": "2025-01-15T12:00:00.000Z"
}
```

---

### Update Subscription

Update existing subscription.

**Endpoint:** `PUT /api/subscriptions/:id`

**Authentication:** Required (must own subscription)

**Request Body:** (partial update supported)
```json
{
  "amount": 12.99,
  "nextBillingDate": "2025-03-01",
  "notes": "Updated to premium plan"
}
```

**Response:** `200 OK`
```json
{
  "_id": "65f1234567890abcdef67890",
  "user": "65f1234567890abcdef12345",
  "name": "Spotify",
  "amount": 12.99,
  "billingCycle": "monthly",
  "category": "Entertainment",
  "nextBillingDate": "2025-03-01T00:00:00.000Z",
  "notes": "Updated to premium plan",
  ...
}
```

**Errors:**
- `404`: Subscription not found
- `401`: Not authorized (not owner)

---

### Delete Subscription

Delete a subscription.

**Endpoint:** `DELETE /api/subscriptions/:id`

**Authentication:** Required (must own subscription)

**Response:** `200 OK`
```json
{
  "message": "Subscription removed"
}
```

**Errors:**
- `404`: Subscription not found
- `401`: Not authorized (not owner)

**Note:** Also deletes associated icon file if exists.

## Calendar Endpoints

### Get Calendar Token

Get or generate calendar subscription token.

**Endpoint:** `GET /api/subscriptions/calendar-token`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "token": "abc123def456",
  "calendarUrl": "http://localhost:5071/api/subscriptions/calendar/abc123def456.ics"
}
```

**Usage:** Subscribe to `calendarUrl` in your calendar app (Apple Calendar, Google Calendar, Outlook).

---

### Get Calendar Feed (Public)

Get iCal feed for subscription with token.

**Endpoint:** `GET /api/subscriptions/calendar/:token.ics`

**Authentication:** None (public with token)

**Response:** `200 OK` (text/calendar)
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Subly//Subscription Tracker//EN
X-WR-CALNAME:Subly - Subscription Payments
...
END:VCALENDAR
```

**Errors:**
- `404`: Invalid calendar token

---

### Download Calendar (Authenticated)

Download iCal file with authentication.

**Endpoint:** `GET /api/subscriptions/calendar.ics`

**Authentication:** Required

**Response:** `200 OK` (text/calendar, attachment)

Downloads `subly-subscriptions.ics` file.

## Invitation Endpoints

### Validate Invitation Code

Check if invitation code is valid (public).

**Endpoint:** `POST /api/invitations/validate`

**Authentication:** None (public)

**Rate Limit:** 10 requests per hour per IP

**Request Body:**
```json
{
  "code": "ABC123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Invitation code is valid"
}
```

**Errors:**
- `404`: Invalid invitation code
- `400`: Code expired or already used

---

### Generate Invitation Codes

Generate new invitation codes (admin only).

**Endpoint:** `POST /api/invitations/generate`

**Authentication:** Required (admin)

**Request Body:**
```json
{
  "count": 5,
  "expiresInDays": 30,
  "note": "Codes for beta testers"
}
```

**Validation:**
- `count`: 1-100 (default: 1)
- `expiresInDays`: 1-365 or null for no expiration (default: null)
- `note`: max 200 characters (optional)

**Response:** `201 Created`
```json
{
  "message": "Successfully generated 5 invitation codes",
  "invitations": [
    {
      "code": "ABC123",
      "expiresAt": "2025-02-15T00:00:00.000Z",
      "note": "Codes for beta testers",
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    ...
  ]
}
```

---

### Get All Invitations

List all invitation codes with stats (admin only).

**Endpoint:** `GET /api/invitations`

**Authentication:** Required (admin)

**Response:** `200 OK`
```json
{
  "invitations": [
    {
      "_id": "65f1234567890abcdef12345",
      "code": "ABC123",
      "createdBy": {
        "_id": "65f1234567890abcdef00000",
        "username": "admin"
      },
      "isUsed": true,
      "usedBy": {
        "_id": "65f1234567890abcdef11111",
        "username": "john_doe"
      },
      "usedAt": "2025-01-16T14:30:00.000Z",
      "expiresAt": null,
      "note": "Beta tester invite",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "stats": {
    "total": 20,
    "active": 10,
    "used": 8,
    "expired": 2
  }
}
```

---

### Delete Invitation Code

Revoke unused invitation code (admin only).

**Endpoint:** `DELETE /api/invitations/:code`

**Authentication:** Required (admin)

**Response:** `200 OK`
```json
{
  "message": "Invitation code revoked successfully"
}
```

**Errors:**
- `404`: Code not found
- `400`: Cannot delete used codes

## Admin Endpoints

### Get All Users

Get paginated list of users (admin only).

**Endpoint:** `GET /api/admin/users`

**Authentication:** Required (admin)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by username or email
- `includeDeleted`: Include soft-deleted users (default: false)

**Example:** `GET /api/admin/users?page=1&limit=20&search=john&includeDeleted=false`

**Response:** `200 OK`
```json
{
  "users": [
    {
      "_id": "65f1234567890abcdef12345",
      "username": "john_doe",
      "email": "john@example.com",
      "emailVerified": true,
      "role": "user",
      "isDeleted": false,
      "createdAt": "2025-01-10T10:00:00.000Z",
      "subscriptionCount": 8,
      "totalMonthlySpend": 125.50
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### Soft Delete User

Deactivate user account (admin only).

**Endpoint:** `PUT /api/admin/users/:id/soft-delete`

**Authentication:** Required (admin)

**Response:** `200 OK`
```json
{
  "message": "User deactivated successfully",
  "user": {
    "_id": "65f1234567890abcdef12345",
    "username": "john_doe"
  }
}
```

**Errors:**
- `404`: User not found
- `400`: Cannot delete own account or already deleted

---

### Restore User

Restore soft-deleted user (admin only).

**Endpoint:** `PUT /api/admin/users/:id/restore`

**Authentication:** Required (admin)

**Response:** `200 OK`
```json
{
  "message": "User restored successfully",
  "user": {
    "_id": "65f1234567890abcdef12345",
    "username": "john_doe"
  }
}
```

---

### Hard Delete User

Permanently delete user and all data (admin only).

**Endpoint:** `DELETE /api/admin/users/:id`

**Authentication:** Required (admin)

**Response:** `200 OK`
```json
{
  "message": "User and all associated data permanently deleted"
}
```

**Warning:** This action is irreversible. Deletes:
- User account
- All subscriptions
- All uploaded icons

---

### Get Admin Statistics

Get dashboard statistics (admin only).

**Endpoint:** `GET /api/admin/stats`

**Authentication:** Required (admin)

**Response:** `200 OK`
```json
{
  "totalUsers": 50,
  "totalDeletedUsers": 3,
  "totalSubscriptions": 380,
  "activeSubscriptions": 320
}
```

## Push Notification Endpoints

### Get VAPID Public Key

Get VAPID public key for browser push subscription.

**Endpoint:** `GET /api/push/vapid-public-key`

**Authentication:** None (public)

**Response:** `200 OK`
```json
{
  "publicKey": "BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

---

### Subscribe to Push Notifications

Save push subscription for user.

**Endpoint:** `POST /api/push/subscribe`

**Authentication:** Required

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNxxxxxxxxxxxxxx...",
    "auth": "xxxxxxxxxxxxxxxx"
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Subscription saved successfully"
}
```

---

### Unsubscribe from Push Notifications

Disable push notifications.

**Endpoint:** `POST /api/push/unsubscribe`

**Authentication:** Required

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Unsubscribed successfully"
}
```

---

### Get Subscription Status

Check if user has active push subscription.

**Endpoint:** `GET /api/push/status`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "subscribed": true
}
```

## Error Handling

### Standard Error Responses

**400 Bad Request:**
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "message": "Invalid credentials"
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied. Admin only."
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**429 Too Many Requests:**
```json
{
  "message": "Too many requests, please try again after 15 minutes"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error",
  "error": "Detailed error message"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server issue |

## Rate Limiting

Rate limits protect the API from abuse.

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/register` | 3 requests | 1 hour |
| `POST /api/auth/login` | 5 requests | 15 minutes |
| `POST /api/invitations/validate` | 10 requests | 1 hour |

### Rate Limit Headers

Responses include rate limit info:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1642185600
```

### Rate Limit Exceeded

```json
{
  "message": "Too many authentication attempts, please try again after 15 minutes"
}
```

Wait until `X-RateLimit-Reset` timestamp before retrying.

## Testing the API

### Using curl

**Login:**
```bash
curl -X POST http://localhost:5071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"SecurePass123"}'
```

**Get subscriptions:**
```bash
curl -X GET http://localhost:5071/api/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create subscription:**
```bash
curl -X POST http://localhost:5071/api/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Netflix",
    "amount": 15.99,
    "billingCycle": "monthly",
    "nextBillingDate": "2025-02-01"
  }'
```

### Using Postman

1. **Import collection** or create requests manually
2. **Set base URL:** `http://localhost:5071/api`
3. **Add authorization:** Bearer Token
4. **Set headers:** `Content-Type: application/json`
5. **Test endpoints**

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5071/api';

// Login
const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    username,
    password
  });
  return response.data;
};

// Get subscriptions
const getSubscriptions = async (token) => {
  const response = await axios.get(`${API_URL}/subscriptions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Create subscription
const createSubscription = async (token, data) => {
  const response = await axios.post(`${API_URL}/subscriptions`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
```

## Next Steps

- [Installation Guide](./INSTALLATION.md) - Setup instructions
- [Configuration Reference](./CONFIGURATION.md) - Environment variables
- [Development Guide](./DEVELOPMENT.md) - Local development
- [Docker Guide](./DOCKER.md) - Docker deployment
