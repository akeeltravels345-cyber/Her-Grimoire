# Systems Audit Methodology for State-Affecting Fixes

**Last Updated**: May 31, 2026  
**Purpose**: Establish a reusable, comprehensive process for auditing all changes that affect application state, data persistence, or consistency.

---

## 1. Definition: What is a State-Affecting Fix?

A **state-affecting fix** is any change that:

- **Modifies data structures** (interfaces, types, model schemas)
- **Changes persistence logic** (AsyncStorage read/write, initial state)
- **Alters state synchronization** (AppContext updates, useEffect dependencies)
- **Impacts data migration** (converting legacy formats, one-time initialization)
- **Changes calculation/derivation** (computed values, derived state)
- **Affects user-facing state** (validation logic, disabled states, conditional rendering)
- **Updates navigation state** (router pushes, parameter passing, history management)
- **Modifies undo/redo systems** (any changes to LIFO stacks or undo logic)
- **Changes filter/sort logic** (how data is queried, ordered, or displayed)

Examples of state-affecting fixes:
- ✅ Adding new field to Ritual interface
- ✅ Changing how manifestations calculate status
- ✅ Updating data migration logic on app load
- ✅ Modifying AsyncStorage persistence keys
- ✅ Changing validation rules in forms
- ✅ Altering navigation flow between screens
- ✅ Updating undo stack logic

Examples of non-state-affecting fixes:
- ❌ Changing button text or colors
- ❌ Adjusting margins/padding
- ❌ Adding comments or refactoring code
- ❌ Fixing typos in static strings
- ❌ Updating styling that doesn't affect layout

---

## 2. Three-Phase Audit Framework

### Phase 1: Scope Analysis & Impact Assessment

**Goal**: Understand what will change and identify all affected systems.

#### Step 1.1: Document the Change
Create a file called `[CHANGE_NAME]_AUDIT_LOG.md` in the project root with:

```markdown
# [Feature/Fix Name] - Audit Log

## Change Summary
- **Description**: What is changing and why?
- **Files Modified**: List all files that will be touched
- **Data Structures Changed**: Any interface/type changes?
- **State Variables Affected**: Which pieces of AppContext state?
- **Persistence Changes**: New/modified AsyncStorage keys?
- **Migration Required**: Will we need to transform existing data?

## Affected Systems
- [ ] Component UI
- [ ] Data persistence (AsyncStorage)
- [ ] State management (AppContext)
- [ ] Data migration (app load)
- [ ] Navigation/routing
- [ ] Validation logic
- [ ] Undo/redo systems
- [ ] Display/computation logic

## Risk Level
- [ ] Low (isolated, no data migration)
- [ ] Medium (multiple components, no migration)
- [ ] High (data migration or complex state changes)
```

#### Step 1.2: Identify Impact Zones
For each affected system, document:

1. **What files depend on this state?**
   ```bash
   grep -r "fieldName" --include="*.tsx" --include="*.ts" /Users/akeel/Grimoire/app /Users/akeel/Grimoire/contexts
   ```

2. **Are there computed values based on this state?**
   - Check for `useMemo`, `useCallback`, derived state
   - Verify all dependencies are correct

3. **Is this persisted to AsyncStorage?**
   - Check AppContext for `useEffect` blocks with `AsyncStorage.setItem`
   - Verify read/write keys match

4. **Does this affect validation or conditional rendering?**
   - Search for places that check this state
   - Ensure all conditions will still work

#### Step 1.3: Create Migration Plan (if needed)
If data structure is changing:

```markdown
## Data Migration Plan

### Old Format
```typescript
{ field: "single_value" }
```

### New Format
```typescript
{ field: ["array", "of", "values"] }
```

### Migration Function
```typescript
const migrateFieldData = (items) => {
  return items.map(item => ({
    ...item,
    field: item.field ? [item.field] : []
  }));
};
```

### When It Runs
- On app load in AppContext useEffect
- Before any components render
- After AsyncStorage data is fetched

### Fallback Behavior
- If both old and new exist, new takes precedence
- Display logic checks new format first, falls back to old
- Users can seamlessly add more values to migrated entries
```

---

### Phase 2: Implementation with Continuous Verification

**Goal**: Implement the change while verifying each step doesn't break other systems.

#### Step 2.1: Implement in Isolation
- **Branch Strategy**: Create feature branch for this change only
- **Single Responsibility**: Each commit should be one logical change
- **No Cleanup**: Don't remove old code yet (backwards compatibility)

#### Step 2.2: Verify After Each Commit

After implementing each component, run:

```bash
# 1. TypeScript compilation (catch type errors early)
npx tsc --noEmit

# 2. Lint check (catch obvious issues)
npm run lint

# 3. App loads (basic functionality)
# Manually test in preview or device
```

#### Step 2.3: Test State Persistence

For EACH component that saves state:

```typescript
// After making a change:
// 1. Save some data
// 2. Close the component
// 3. Reopen the app
// 4. Verify data persisted correctly
// 5. Check AsyncStorage directly

const stored = await AsyncStorage.getItem('key');
console.log('Stored data:', JSON.parse(stored));
```

#### Step 2.4: Log Implementation Steps

In your audit log, document:

```markdown
## Implementation Progress

### Step 1: Update Data Model ✅
- Modified Ritual interface to add `categories: string[]`
- Kept legacy `category?: string` for fallback
- Verified TypeScript compilation: PASS

### Step 2: Add Migration Logic ✅
- Created `migrateRitualsData()` function
- Hooked into AppContext initialization
- Tested with console logs: PASS
- Sample migration: `{category: "x"}` → `{categories: ["x"]}`

### Step 3: Update Form Component ✅
- Changed `selectedCategory` to `selectedCategories`
- Updated save handler: single value → array
- Added min/max validation
- Tested form save: PASS

### Step 4: Update Display Components ✅
- Changed from `ritual.category` to `ritual.categories[0]`
- Updated to show all categories when rendering
- Tested with both new and legacy data: PASS
```

---

### Phase 3: End-to-End Verification

**Goal**: Verify the complete flow works in all scenarios.

#### Step 3.1: Create a Verification Checklist

```markdown
## Verification Checklist

### Data Model Tests
- [ ] TypeScript compilation succeeds
- [ ] All interfaces updated consistently
- [ ] No breaking changes in dependent code

### Migration Tests (if applicable)
- [ ] Create new data with new format
- [ ] Verify it persists correctly
- [ ] Close app and reopen - data still there
- [ ] Add old-format data manually
- [ ] App loads and migrates automatically
- [ ] No data loss in migration
- [ ] Both old and new formats display correctly after migration

### Form/Input Tests
- [ ] Create with new feature (e.g., multi-select)
- [ ] Edit existing item - can use new feature
- [ ] Save and reopen - new data preserved
- [ ] Validation rules enforced correctly
- [ ] Minimum requirements met
- [ ] Maximum limits respected
- [ ] Disabling/enabling works as expected

### Display/Output Tests
- [ ] List views show data correctly
- [ ] Detail views show all values
- [ ] Computed/derived values accurate
- [ ] No overflow or layout issues
- [ ] Colors/styling applied correctly
- [ ] Fallback for missing data works

### Navigation/Routing Tests
- [ ] Navigation between screens works
- [ ] State maintained on navigation
- [ ] Back button behavior correct
- [ ] Deep links (if applicable) work

### Persistence Tests
- [ ] Data saves to AsyncStorage
- [ ] Close app completely (force quit)
- [ ] Reopen app
- [ ] All data still present and accurate
- [ ] Migration ran if needed
- [ ] No duplicates created

### Edge Cases
- [ ] Empty/null data handled gracefully
- [ ] Large data sets don't cause performance issues
- [ ] Network issues (if applicable) handled
- [ ] Rapid state changes don't cause conflicts
- [ ] Concurrent operations don't corrupt data

### Backward Compatibility
- [ ] Old data format still works
- [ ] Users don't lose data when updating
- [ ] New features visible to new users
- [ ] Existing users can access new features
- [ ] No console errors or warnings
```

#### Step 3.2: Scenario Testing

For each major user journey, test the complete flow:

```markdown
### Scenario 1: User with NO prior data (fresh install)
- [ ] Install fresh app
- [ ] Create new item with new feature
- [ ] Edit item - verify new features work
- [ ] Close and reopen app
- [ ] Verify data persisted and displays correctly

### Scenario 2: User with LEGACY data (existing user)
- [ ] Manually add old-format data to AsyncStorage
- [ ] Load app
- [ ] Verify migration ran
- [ ] Check that legacy data works with new UI
- [ ] User can add more values to migrated items
- [ ] No data loss

### Scenario 3: Partial Migration (device sync)
- [ ] Create new-format data on device A
- [ ] Sync to device B that still has old app
- [ ] Upgrade device B
- [ ] Verify migration handles mixed formats
- [ ] Both devices can still sync correctly

### Scenario 4: Rapid State Changes
- [ ] Create item, immediately edit, save before complete
- [ ] Make multiple changes rapidly
- [ ] Close app during save operation
- [ ] Reopen app - verify data integrity
```

#### Step 3.3: Performance Testing

```markdown
### Performance Checks
- [ ] App loads in <2 seconds with 100+ items
- [ ] Lists render smoothly (no jank)
- [ ] Forms are responsive to input
- [ ] AsyncStorage operations don't block UI
- [ ] Migration completes <500ms on app load
- [ ] No memory leaks with large datasets
```

#### Step 3.4: Documentation Review

Before considering a fix complete:

```markdown
## Documentation Audit

- [ ] All code changes commented appropriately
- [ ] Interfaces/types have JSDoc comments
- [ ] Fallback logic documented (why both formats exist)
- [ ] Migration assumptions documented
- [ ] Known limitations documented
- [ ] Edge cases documented
- [ ] Changes reflected in any API docs
```

---

## 3. Specific Audit Templates by Type

### Template A: Data Structure Changes

Use this when adding/modifying interfaces or types:

```markdown
## Data Structure Change Audit

### Change Details
- **Interface**: [Ritual, JournalEntry, etc.]
- **Field**: [fieldName]
- **Old Type**: [original type]
- **New Type**: [new type]
- **Required Field**: [yes/no]
- **Has Default**: [yes/no]

### Impact Analysis
Files that read this field:
- [ ] List from grep results
- Update all readers to handle new type

Files that write this field:
- [ ] List from grep results
- Update all writers to set correct type

### Verification
- [ ] Type checking passes
- [ ] All readers compile
- [ ] All writers set the field correctly
- [ ] Default values work
- [ ] Migration handles old format
```

### Template B: State Persistence Changes

Use this when modifying AsyncStorage, caching, or persistence:

```markdown
## State Persistence Audit

### Change Details
- **AsyncStorage Key**: [OLD_KEY_NAME → NEW_KEY_NAME]
- **Data Type**: [what type of data is persisted]
- **Persistence Point**: [where in code is it saved]
- **Read Point**: [where in code is it loaded]

### Keys Affected
- [ ] List old keys that may still be in storage
- [ ] Plan cleanup strategy

### Verification
Step 1: Create data
- [ ] Trigger creation of this state
- [ ] Verify AsyncStorage.getItem() shows data

Step 2: Close app
- [ ] Force quit app
- [ ] Don't run in background

Step 3: Reopen app
- [ ] Verify data loads correctly
- [ ] Check AsyncStorage.getItem() still has data

Step 4: Clean up
- [ ] Remove or migrate old keys
- [ ] Update migration function if needed
```

### Template C: Undo/Redo System Changes

Use this when modifying undo stacks or redo logic:

```markdown
## Undo/Redo System Audit

### Change Details
- **Stack Type**: [LIFO, chronological, etc.]
- **Action Type**: [what actions go on the stack]
- **Stack Location**: [AppContext, component state, etc.]

### Stack Operations
- [ ] Push operation tested (add to stack)
- [ ] Pop operation tested (remove from stack)
- [ ] Peek operation tested (view without removing)
- [ ] Clear operation tested (reset stack)
- [ ] Size limits tested (max stack size)

### Undo Flow Tests
- [ ] Action 1 → Undo → State matches before Action 1
- [ ] Action 1 → Action 2 → Undo → State matches before Action 2
- [ ] Action 1 → Action 2 → Undo → Undo → State matches initial
- [ ] Action 1 → Undo → Redo → State matches after Action 1

### Edge Cases
- [ ] Undo with empty stack (no crash)
- [ ] Redo with empty redo stack (no crash)
- [ ] Multiple rapid undos (LIFO order correct)
- [ ] Undo then new action (clears redo stack)
- [ ] Undo on data boundary (first/last item)
```

### Template D: Navigation & Routing Changes

Use this when modifying route parameters, navigation flow, or history:

```markdown
## Navigation & Routing Audit

### Change Details
- **Route**: [/path or /path/[param]]
- **Parameters**: [list of parameters passed]
- **Previous Screen**: [screen navigating FROM]
- **Next Screen**: [screen navigating TO]

### Parameter Flow
- [ ] Parameter passed correctly via router.push()
- [ ] Parameter accessed correctly on new screen
- [ ] Parameter typed correctly (no type errors)
- [ ] Parameter persists if needed
- [ ] Parameter cleared if needed

### Navigation Flow Tests
- [ ] Forward navigation (A → B) works
- [ ] Back navigation (B ← A) returns correctly
- [ ] Back button shows correct previous screen
- [ ] History maintained across multiple navigations
- [ ] Deep links work (if applicable)

### State on Navigation
- [ ] State preserved navigating forward
- [ ] State preserved navigating back
- [ ] Modal dismiss closes without navigation
- [ ] Parameter mismatch handled gracefully
- [ ] Missing parameters don't crash app
```

### Template E: Validation Logic Changes

Use this when modifying form validation, business rules, or constraints:

```markdown
## Validation Logic Audit

### Change Details
- **Field/Feature**: [what is being validated]
- **Old Rules**: [previous validation]
- **New Rules**: [updated validation]
- **Examples of Valid Data**: [list examples]
- **Examples of Invalid Data**: [list examples]

### Rule Tests
For each rule:
- [ ] Valid data passes
- [ ] Invalid data fails
- [ ] Error message is helpful
- [ ] Edge cases handled (null, empty, etc.)
- [ ] Boundary values tested (min/max)

### UI Tests
- [ ] Save button disabled when invalid
- [ ] Save button enabled when valid
- [ ] Error messages display correctly
- [ ] Inline validation feedback works
- [ ] Can correct error and re-submit

### Data Integrity
- [ ] Invalid data can't be persisted
- [ ] Invalid data can't be migrated
- [ ] Recovery from validation failure is clear
```

---

## 4. Common Pitfalls & How to Avoid Them

### Pitfall #1: Incomplete Data Migration
**Problem**: Some legacy data doesn't get converted, causing crashes.

**Prevention**:
- ✅ Migration function has comprehensive logging
- ✅ Test migration with 100+ items of legacy data
- ✅ Verify EVERY item was migrated (count before/after)
- ✅ Check edge cases: empty fields, null, undefined
- ✅ Keep fallback logic indefinitely

### Pitfall #2: Missing Dependency in useEffect
**Problem**: State changes don't trigger recalculations because dependency array is incomplete.

**Prevention**:
- ✅ Use ESLint rule: `exhaustive-deps`
- ✅ When editing useEffect, manually verify all dependencies
- ✅ If a state change doesn't trigger expected effect, check dependencies
- ✅ Write tests that change state and verify side effects run

### Pitfall #3: AsyncStorage Key Collision
**Problem**: Multiple pieces of code write to same key, causing data corruption.

**Prevention**:
- ✅ Grep for all uses of key name before changing
- ✅ Use consistent naming: `RITUAL_KEY`, `JOURNAL_ENTRY_KEY`
- ✅ Document what each key stores in AppContext
- ✅ Never have two useEffect blocks writing to same key

### Pitfall #4: Navigation State Sync Issues
**Problem**: Component A passes state to Component B, but B doesn't update when A's state changes.

**Prevention**:
- ✅ Use AppContext for shared state, not route params
- ✅ Route params for one-time values (IDs)
- ✅ UseEffect with dependency on route params if needed
- ✅ Test navigation forward and back

### Pitfall #5: Type Safety Regression
**Problem**: Change works at runtime but TypeScript errors appear.

**Prevention**:
- ✅ Run `npx tsc --noEmit` after every change
- ✅ Don't use `any` type as a workaround
- ✅ Update all type definitions before updating code
- ✅ Test TypeScript compilation in CI/CD

### Pitfall #6: Undo/Redo Stack Corruption
**Problem**: Stack has items in wrong order, or contains stale data.

**Prevention**:
- ✅ Always use push/pop operations, never manipulate directly
- ✅ Deep copy data into stack (don't store references)
- ✅ Log every push/pop with timestamps
- ✅ Test undo chain: Undo 3 times should reverse last 3 actions

### Pitfall #7: Performance Regression
**Problem**: Change causes app to lag or crash with large data sets.

**Prevention**:
- ✅ Test with 100+ items before considering done
- ✅ Check for unnecessary re-renders with React DevTools
- ✅ Profile AsyncStorage operations (should be <100ms)
- ✅ Use useMemo for expensive calculations
- ✅ Monitor battery/memory usage with large datasets

### Pitfall #8: Loss of User Data
**Problem**: Migration loses some fields or overwrites existing data.

**Prevention**:
- ✅ NEVER overwrite data without backup strategy
- ✅ LIFO undo for destructive operations
- ✅ Migration function only adds/transforms, never deletes
- ✅ Test with real user data (export, import, test locally)
- ✅ Have rollback plan if deployment needed

---

## 5. Quick Reference: Audit Checklist for Every Fix

Use this minimal checklist for small state-affecting fixes:

```markdown
## Quick Audit Checklist

### Before Starting
- [ ] Change is truly state-affecting?
- [ ] I understand all affected systems?
- [ ] Migration needed? Plan it first.

### During Implementation
- [ ] TypeScript compiles after each commit?
- [ ] Linting passes?
- [ ] Changes work in isolation?
- [ ] I tested the specific feature?

### Before Marking Complete
- [ ] Created test data with new format?
- [ ] Saved, closed app, reopened - data persisted?
- [ ] Tested with legacy data format?
- [ ] All display/edit flows work?
- [ ] Navigation works?
- [ ] Performance acceptable?
- [ ] Updated audit log with results?
```

---

## 6. Tools & Techniques

### Debugging Tools

**React DevTools**
```bash
# In preview/dev, open React DevTools
# Check component renders (is something re-rendering unnecessarily?)
# Inspect state (what is AppContext actually storing?)
```

**AsyncStorage Inspector**
```typescript
// In console while debugging:
import AsyncStorage from '@react-native-async-storage/async-storage';
const data = await AsyncStorage.getItem('key');
console.log('Stored:', JSON.parse(data));
```

**Grep for Dependencies**
```bash
# Find all places that touch a specific field:
grep -r "fieldName" --include="*.tsx" --include="*.ts" \
  /Users/akeel/Grimoire/app \
  /Users/akeel/Grimoire/contexts \
  /Users/akeel/Grimoire/services

# Find all AsyncStorage operations:
grep -r "AsyncStorage" --include="*.tsx" --include="*.ts" \
  /Users/akeel/Grimoire/contexts
```

**TypeScript Strict Mode**
```bash
# Catch type errors before runtime:
npx tsc --noEmit --strict
```

**Performance Profiling**
```typescript
// Add to any function to time it:
const start = performance.now();
// ... do work ...
console.log(`Operation took ${performance.now() - start}ms`);
```

---

## 7. Example Audit: Multi-Select Categories & Moods

This was the major state-affecting change that established the patterns in this document.

### Summary
Changed `category: string` to `categories: string[]` (and similar for moods) across entire app.

### Phases

**Phase 1: Scope Analysis**
- Impact: 7 files modified, data migration required, backward compatibility needed
- Risk Level: High (data migration, affects all ritual operations)

**Phase 2: Implementation**
- Updated interfaces in mockData.ts
- Added migration functions in AppContext
- Updated 4 form components
- Updated 6 display components
- Verified at each step

**Phase 3: Verification**
- Created new ritual with multiple categories → persisted correctly
- Edited existing ritual → could add more categories
- Added legacy data, app loaded, migration ran, no data loss
- All display components showed all categories
- Performance acceptable with 100+ rituals
- Documented in IMPLEMENTATION_SUMMARY.md

---

## 8. Maintaining This Methodology

### When to Update This Document
- When new patterns emerge (add to Section 4: Common Pitfalls)
- When new tools become available (add to Section 6: Tools)
- When a major fix introduces new verification needs (add template to Section 3)

### How to Use Going Forward
1. **For small fixes**: Use Section 5: Quick Audit Checklist
2. **For medium fixes**: Use Section 2: Three-Phase Framework + relevant template from Section 3
3. **For major fixes**: Use full three-phase framework + create audit log file

### Continuous Improvement
After each fix:
- [ ] Update audit log with any unexpected issues
- [ ] If patterns emerge, add to common pitfalls
- [ ] If methodology was unclear, clarify documentation
- [ ] Share learnings with team

---

## Summary

This methodology ensures:
- ✅ **No silent data corruption** - Every change is systematically verified
- ✅ **Complete backward compatibility** - Legacy data is handled gracefully
- ✅ **Performance maintained** - Changes don't introduce lag
- ✅ **User data safety** - No data loss during migrations
- ✅ **Clear documentation** - Future developers understand why changes were made
- ✅ **Reusable patterns** - Templates can be applied to new changes
