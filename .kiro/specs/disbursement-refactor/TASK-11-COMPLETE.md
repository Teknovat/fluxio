# Phase 11 Task 17.1 Complete - Alert System Updates

## Summary

Successfully updated the alert system to use disbursement terminology and added two new alert types for better monitoring of outstanding disbursements.

## Changes Made

### 1. Updated Alert Types (types/index.ts)

- Renamed `OVERDUE_ADVANCE` → `OVERDUE_DISBURSEMENT`
- Added `LONG_OPEN_DISBURSEMENT` - alerts for disbursements open > 30 days
- Added `HIGH_OUTSTANDING_DISBURSEMENTS` - alerts when total outstanding exceeds threshold

### 2. Updated Alert Functions (lib/alerts.ts)

**Updated existing function:**

- `checkOverdueDisbursements()` - now uses `AlertType.OVERDUE_DISBURSEMENT`

**Added new functions:**

- `checkLongOpenDisbursements()` - creates alerts for disbursements open > 30 days
  - Checks disbursements created more than 30 days ago
  - Only alerts on non-justified disbursements
  - Shows days outstanding in message
- `checkHighOutstandingDisbursements()` - creates alert when total outstanding is too high
  - Sums all remaining amounts from non-justified disbursements
  - Compares against threshold (defaults to 10000 if not configured)
  - Creates single alert for the total, not per disbursement

**Updated main function:**

- `checkAndCreateAlerts()` - now calls all 6 alert checking functions including the 2 new ones

### 3. Updated Tests (lib/alerts.test.ts)

- Updated existing test to use `AlertType.OVERDUE_DISBURSEMENT`
- Added test for `LONG_OPEN_DISBURSEMENT` alert
- Added test for `HIGH_OUTSTANDING_DISBURSEMENTS` alert

### 4. Updated Schema Documentation (prisma/schema.prisma)

- Updated Alert model comment to list all current alert types

## Alert Types Summary

| Alert Type                     | Severity | Trigger Condition                       | Related Entity |
| ------------------------------ | -------- | --------------------------------------- | -------------- |
| DEBT_THRESHOLD                 | WARNING  | Intervenant debt > threshold            | Intervenant    |
| LOW_CASH                       | ERROR    | Cash balance < minimum                  | None           |
| OVERDUE_DISBURSEMENT           | WARNING  | Disbursement past due date              | Disbursement   |
| LONG_OPEN_DISBURSEMENT         | WARNING  | Disbursement open > 30 days             | Disbursement   |
| HIGH_OUTSTANDING_DISBURSEMENTS | WARNING  | Total outstanding > threshold           | None           |
| RECONCILIATION_GAP             | ERROR    | Physical vs theoretical gap > threshold | Reconciliation |

## Configuration

The new alert functions use these settings:

- `disbursementOutstandingThreshold` - defaults to 10000 if not set
- Long open threshold is hardcoded to 30 days (can be made configurable in task 17.3)

## Remaining Work

Task 17.2 and 17.3 still need to be completed:

- Create alert display components and integrate into UI
- Add alert configuration settings to Settings model and UI
- Display alerts on Cash Dashboard
- Add alert count badge in navigation

## Testing

All tests pass with the new alert types. The alert system correctly:

- Creates alerts for overdue disbursements
- Creates alerts for long-open disbursements (> 30 days)
- Creates alerts for high total outstanding amounts
- Does not create duplicate alerts
- Respects the alertsEnabled setting

## Files Modified

1. `types/index.ts` - Updated AlertType enum
2. `lib/alerts.ts` - Updated functions and added new alert checks
3. `lib/alerts.test.ts` - Updated and added tests
4. `prisma/schema.prisma` - Updated Alert model comment
5. `.kiro/specs/disbursement-refactor/tasks.md` - Marked task 17.1 as complete
