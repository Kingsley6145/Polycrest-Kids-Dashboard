# Firebase Rules Update Required

Your current Firebase rules have `.read: false` for the enrollments path, which prevents the dashboard from fetching data.

## Updated Rules

Update your Firebase Realtime Database rules to allow reading from the enrollments path:

```json
{
  "rules": {
    "enrollments": {
      ".read": true,
      ".write": true,
      "$enrollmentId": {
        ".validate": "newData.hasChildren(['parentName', 'parentEmail', 'parentPhone', 'parentRelation', 'kidName', 'kidAge', 'kidGender', 'selectedCourse', 'preferredTime', 'startDate', 'submittedAt', 'timestamp'])",
        "parentName": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
        },
        "parentEmail": {
          ".validate": "newData.isString() && newData.val().matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$/)"
        },
        "parentPhone": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 20"
        },
        "parentRelation": {
          ".validate": "newData.isString() && newData.val().matches(/^(Mother|Father|Guardian|Other)$/)"
        },
        "kidName": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
        },
        "kidAge": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 2"
        },
        "kidGender": {
          ".validate": "newData.isString() && newData.val().matches(/^(Boy|Girl|Other)$/)"
        },
        "kidInterests": {
          ".validate": "newData.hasChildren() || newData.val() === null"
        },
        "selectedCourse": {
          ".validate": "newData.isString() && newData.val().matches(/^(playgroup|nursery|junior|senior)$/)"
        },
        "preferredTime": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "startDate": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "submittedAt": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "timestamp": {
          ".validate": "newData.isNumber()"
        },
        "courseName": {
          ".validate": "newData.isString()"
        },
        "status": {
          ".validate": "newData.isString() && newData.val().matches(/^(pending|approved|waitlisted)$/)"
        },
        "notes": {
          ".validate": "newData.isString() || newData.val() === null"
        },
        "$other": {
          ".validate": false
        }
      }
    },
    ".read": false,
    ".write": false
  }
}
```

## Key Changes:
1. Changed `"enrollments": { ".read": false, ... }` to `"enrollments": { ".read": true, ... }`
2. Added validation for optional `status` field (pending, approved, waitlisted)
3. Added validation for optional `notes` field

## How to Update:
1. Go to Firebase Console → Realtime Database → Rules
2. Replace your current rules with the updated rules above
3. Click "Publish"

After updating the rules, your dashboard should be able to fetch and display enrollment data.

