# Disbursement Refactor & Cash Dashboard - Project Overview

## Executive Summary

This specification covers a major refactoring of the Fluxio cash management system, transforming the "Advance" module into a more accurate "Disbursement" module and adding a new Cash Dashboard for real-time cash visibility.

## Key Changes

### 1. Conceptual Model Change

**Before (Advance Model):**

- ❌ Confusing: "Advance" and "Reimbursement" both create cash movements
- ❌ Unclear: Is money being used or returned?
- ❌ Inaccurate: Reimbursement implies money coming back, but often it's just justification

**After (Disbursement Model):**

- ✅ Clear: Disbursement = real cash leaving
- ✅ Clear: Justification = proof of use (NO cash movement)
- ✅ Clear: Return to Cash = real cash coming back (creates movement)

### 2. Business Rules

#### Disbursement Creation

- Creates a **real cash outflow** (SORTIE movement)
- Records: initialAmount, remainingAmount, status (OPEN)
- Used for: stock purchases, bank deposits, salary advances, expenses

#### Justification (NEW concept)

- **Does NOT create any cash movement**
- Only reduces the remainingAmount
- Requires: date, amount, category, optional reference/note
- When remainingAmount = 0 → status = JUSTIFIED

#### Return to Cash

- Creates a **real cash inflow** (ENTREE movement)
- Reduces remainingAmount
- Used when unused funds are physically returned

### 3. New Cash Dashboard

A dedicated dashboard providing:

- **Current cash balance** (prominent display)
- **Today's summary** (inflows, outflows, net change)
- **Quick actions** (Add Inflow, Create Disbursement)
- **Recent movements** (last 20 transactions)
- **Balance trend chart** (30-day history)
- **Outstanding disbursements** summary
- **Active alerts**

## Technical Architecture

### Database Changes

```
Advance → Disbursement
├── Add: initialAmount, remainingAmount, category
├── Rename: status values (EN_COURS → OPEN, etc.)
└── Relations: justifications[], returns[]

NEW: Justification
├── Fields: date, amount, category, reference, note
├── Relation: disbursement
└── NO associated Movement

Mouvement
├── Rename: isAdvance → isDisbursement
├── Rename: advanceId → disbursementId
└── Update: relations
```

### API Endpoints

**Disbursements:**

- `GET /api/disbursements` - List with filters
- `POST /api/disbursements` - Create new
- `GET /api/disbursements/[id]` - Get details
- `POST /api/disbursements/[id]/justify` - Add justification (NO movement)
- `POST /api/disbursements/[id]/return` - Return to cash (creates movement)
- `GET /api/disbursements/summary` - Summary stats

**Cash Dashboard:**

- `GET /api/cash/dashboard` - Complete dashboard data
- `GET /api/cash/balance` - Current balance only
- `POST /api/cash/inflow` - Quick add inflow

### Frontend Pages

1. **Cash Dashboard** (`/dashboard`) - NEW

   - Default home page
   - Real-time cash visibility
   - Quick actions

2. **Disbursements List** (`/disbursements`) - Renamed from `/avances`

   - List all disbursements
   - Filters: status, intervenant, date, category
   - Actions: Justify, Return

3. **Disbursement Detail** (`/disbursements/[id]`) - NEW
   - Complete history
   - Separate sections: Justifications vs Returns
   - Progress tracking

### Key Components

- `DisbursementCard` - Display disbursement with progress
- `DisbursementForm` - Create new disbursement
- `JustificationForm` - Add justification (clear: NO cash movement)
- `ReturnToCashForm` - Record return (clear: CREATES cash movement)
- `CashBalanceCard` - Prominent balance display
- `CashInflowForm` - Quick add inflow
- `CashBalanceTrendChart` - 30-day trend visualization

## Implementation Phases

### Phase 1: Database (Critical)

1. Update Prisma schema
2. Create migration
3. Create data migration script
4. Test thoroughly

### Phase 2: Types & Calculations

1. Update TypeScript types
2. Create calculation utilities
3. Write unit tests

### Phase 3-4: Backend APIs

1. Disbursement endpoints
2. Justification endpoints
3. Return to cash endpoints
4. Cash dashboard endpoints

### Phase 5-8: Frontend

1. Disbursement components
2. Disbursement pages
3. Cash dashboard components
4. Cash dashboard page

### Phase 9-11: Integration

1. Navigation updates
2. Intervenant integration
3. Alerts system

### Phase 12-14: Finalization

1. Reporting & export
2. Testing (integration & e2e)
3. Documentation & deployment

## Migration Strategy

### Data Migration

```typescript
// Convert existing Advance records
Advance → Disbursement
├── amount → initialAmount
├── Calculate remainingAmount from reimbursements
├── EN_COURS → OPEN
├── REMBOURSE_PARTIEL → PARTIALLY_JUSTIFIED
└── REMBOURSE_TOTAL → JUSTIFIED

// Keep existing reimbursements as movements
// Future: Optionally convert some to justifications
```

### Backward Compatibility

- Redirect `/avances` → `/disbursements`
- Redirect `/avances/[id]` → `/disbursements/[id]`
- Maintain redirects for 3+ months
- Update all internal links

### Rollback Plan

- Transaction-based migration
- Rollback script included
- Database backup before migration
- Staging environment testing

## Key Differences to Highlight

### In UI/UX

1. **Justification Form:**

   - ⚠️ Clear message: "This does NOT create a cash movement"
   - Purpose: Document how funds were used

2. **Return to Cash Form:**

   - ⚠️ Clear message: "This WILL create a cash inflow"
   - Purpose: Record physical return of unused funds

3. **Disbursement Detail:**

   - Separate sections: "Justifications" vs "Returns to Cash"
   - Clear visual distinction

4. **Terminology:**
   - "Avance" → "Décaissement"
   - "Remboursement" → "Justification" or "Retour en Caisse"
   - "En Cours" → "Ouvert"

## Success Criteria

### Functional

- ✅ All disbursements migrated successfully
- ✅ Justifications do NOT create movements
- ✅ Returns DO create movements
- ✅ Cash balance calculated correctly
- ✅ Dashboard displays real-time data

### Technical

- ✅ All tests passing
- ✅ No data loss during migration
- ✅ Performance maintained or improved
- ✅ Tenant isolation enforced
- ✅ Backward compatibility maintained

### User Experience

- ✅ Clear distinction between justification and return
- ✅ Intuitive cash dashboard
- ✅ Quick actions work smoothly
- ✅ Users understand new terminology
- ✅ No confusion about cash movements

## Risk Mitigation

### High Risk: Data Migration

- **Mitigation:** Extensive testing on staging
- **Mitigation:** Transaction-based migration with rollback
- **Mitigation:** Database backup before migration

### Medium Risk: User Confusion

- **Mitigation:** Clear UI messages
- **Mitigation:** User training materials
- **Mitigation:** Gradual rollout with support

### Medium Risk: Breaking Changes

- **Mitigation:** Backward-compatible redirects
- **Mitigation:** Deprecation notices
- **Mitigation:** Version documentation

## Timeline Estimate

- **Phase 1-2 (Database & Types):** 3-5 days
- **Phase 3-4 (Backend APIs):** 5-7 days
- **Phase 5-8 (Frontend):** 7-10 days
- **Phase 9-11 (Integration):** 3-5 days
- **Phase 12-14 (Testing & Deployment):** 5-7 days

**Total Estimate:** 23-34 days (4-7 weeks)

## Next Steps

1. **Review this specification** with stakeholders
2. **Approve the approach** and timeline
3. **Set up staging environment** for testing
4. **Begin Phase 1** (Database schema updates)
5. **Test migration** on copy of production data
6. **Proceed incrementally** through phases

## Questions to Resolve

1. Should we convert existing reimbursements to justifications automatically?

   - **Recommendation:** Keep as movements initially, allow manual conversion later

2. What should be the default disbursement category for migrated advances?

   - **Recommendation:** SALARY_ADVANCE (most common use case)

3. Should we maintain the old /avances routes indefinitely?

   - **Recommendation:** Maintain for 3 months, then remove with warning

4. Should justifications support file attachments immediately?
   - **Recommendation:** Add field to schema, implement upload later

## Support & Documentation

- **Requirements:** `.kiro/specs/disbursement-refactor/requirements.md`
- **Design:** `.kiro/specs/disbursement-refactor/design.md`
- **Tasks:** `.kiro/specs/disbursement-refactor/tasks.md`
- **This Overview:** `.kiro/specs/disbursement-refactor/README.md`

## Contact

For questions or clarifications about this specification, please refer to the detailed requirements and design documents, or consult with the development team.
