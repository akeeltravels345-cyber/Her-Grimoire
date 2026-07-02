# Ritual Status Update Analysis - Complete Interdependency Map

**Status**: Investigation in Progress  
**Issue**: Ritual status doesn't update in Practice tab UI after "Log Complete" flow  
**Date**: May 25, 2026

---

## Problem Statement

User completes the following workflow:
1. Opens as_needed ritual from Practice tab
2. Clicks "Log Complete" button
3. Logs journal entry and saves
4. Returns to Practice tab via router.replace('/(tabs)/rituals')
5. **BUG**: Ritual still shows incomplete (check button) instead of check-circle icon

**Data Update**: The ritual.status IS being set to 'completed' in AppContext ✓  
**Persistence**: Changes ARE being saved to AsyncStorage ✓  
**Display Issue**: UI doesn't reflect the updated status ✗

---

## Data Flow Map

### 1. Ritual Status Update Chain

**Source**: ritual/[id].tsx (line 1044)
```
User clicks "Log Complete"
  ↓
router.push('/log-ritual', {ritualId, returnTo: '/(tabs)/rituals'})
  ↓
log-ritual.tsx receives params
  ↓
User fills journal entry and clicks Save
  ↓
log-ritual.tsx line 57-79: handleSave()
  - Calls addJournalEntry(ritualId, entry, {markComplete: true})
  - Calls router.replace('/(tabs)/rituals')
```

**AppContext Update**: AppContext.tsx lines 699-718 (addJournalEntry)
```typescript
const addJournalEntry = (ritualId: string, entry, opts = {markComplete: true}) => {
  setRituals(prev => prev.map(r => {
    if (r.id !== ritualId) return r;
    if (markComplete) {
      return {
        ...r,
        status: 'completed',           // ← STATUS SET HERE
        timesPerformed: r.timesPerformed + 1,
        journal: [newEntry, ...r.journal],
        lastPerformed: newLastPerformed,
      };
    }
    return r;
  }));
};
```

**Persistence**: AppContext.tsx lines 357-362
```typescript
useEffect(() => {
  if (isLoaded) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rituals));
    scheduleAllReminders();
  }
}, [rituals, isLoaded]);  // ← Triggers whenever rituals changes
```

✓ Status update is set  
✓ Rituals state is updated  
✓ AsyncStorage persists the change

---

### 2. UI Rendering Chain - Rituals Tab Display

**Component**: app/(tabs)/rituals.tsx

**Context Subscription** (line 124):
```typescript
const { rituals, libraryRituals, ... } = useApp();
```
- ✓ Subscribes to rituals changes
- ✓ Should trigger re-render when rituals changes

**Status Computation** (line 223):
```typescript
const ritualsWithComputed = useMemo(
  () => rituals.map(r => ({...r, computedStatus: getComputedStatus(r)})),
  [rituals]  // ← Dependency is rituals
);
```
- ✓ Recalculates whenever rituals changes
- ✓ Dependency array includes rituals

**Status Computation Function** (mockData.ts, lines 95-106):
```typescript
export function getComputedStatus(ritual): 'completed' | ... {
  if (ritual.status === 'completed') return 'completed';  // ← LINE 96
  ...
}
```
- ✓ Returns 'completed' when ritual.status === 'completed'
- ✓ No apparent logic errors

**Ritual List Filtering** (line 283-295):
```typescript
const filtered = useMemo(() => {
  let list = ritualsWithComputed;  // Uses computed status
  if (selectedDay) {
    list = list.filter(r => {
      if (r.scheduledDate) return isSameDay(new Date(r.scheduledDate), selectedDay);
      if (!r.scheduledDate && r.schedule === 'as_needed' && isViewingToday) {
        return r.status !== 'completed' && r.status !== 'dismissed';
      }
      return false;
    });
  }
  // ... more filtering
  return list;
}, [ritualsWithComputed, selectedDay, /* ... */]);
```
- ⚠️ **POTENTIAL ISSUE**: Line 291 filters OUT completed as_needed rituals when viewing today
- ⚠️ If ritual is as_needed with no scheduledDate and is_viewing_today, it filters by `r.status !== 'completed'`
- ⚠️ This means once ritual is completed, it won't appear in the practice tab list at all!

**Display Component** (CompactRitualItem):
```typescript
{ritual.computedStatus !== 'completed' 
  ? <check icon>                    // Shows check button
  : <check-circle icon>             // Shows check-circle icon
}
```

---

## Critical Dependencies Analysis

### Dependency 1: Manifestation Locking (manifestation/[id].tsx, lines 64-70)
```typescript
const isLocked = ritual && !ritual.status && ritual.schedule !== 'as_needed'
  ? ritual.timesPerformed === 0 && ritual.journal.length === 0
  : ritual?.status !== 'completed';

const lockMessage = ritual?.schedule === 'as_needed'
  ? 'Log this ritual as complete to add signs and manifest'
  : 'Log your first entry to start tracking signs';
```

**Interdependency**: Manifestation lock feature depends on ritual.status
- When status='completed', manifestations should unlock ✓
- This is working correctly (user can interact with Cauldron after logging)

### Dependency 2: Notification Scheduling (AppContext.tsx, lines 159-213)
```typescript
async function scheduleRemindersForRitual(ritual) {
  if (!ritual.scheduledDate || ritual.status === 'completed') {
    await cancelNotificationsForRitual(ritual.id);  // ← Cancels when completed
    return;
  }
  // ... schedule reminders ...
}
```

**Interdependency**: Notifications cancel when status='completed'
- This ensures no more reminders for completed rituals ✓

### Dependency 3: Ritual Deletion (AppContext.tsx, lines 611-625)
```typescript
const deleteRitual = (id, deleteHistory = true) => {
  const ritual = rituals.find(r => r.id === id);
  cancelNotificationsForRitual(id);
  setRituals(prev => prev.filter(r => r.id !== id));
  if (deleteHistory && !ritual?.seriesId && !ritual?.groupId) {
    setManifestations(prev => prev.filter(m => m.ritualId !== id));
  }
};
```

**Interdependency**: Delete logic checks ritual properties
- Status updates don't affect deletion logic directly
- But deletion cascades to manifestations

### Dependency 4: Manifestation Auto-Creation (AppContext.tsx, lines 375-438)
```typescript
useEffect(() => {
  if (!isLoaded) return;
  const ritualsNeedingManifest = rituals.filter(ritual => {
    if (!ritual.tangibleOutcome || ritual.tangibleOutcome.trim().length === 0) return false;
    if (!ritual.scheduledDate) return false;
    const isCurrentMonth = /* ... check month ... */;
    if (!isCurrentMonth) return false;
    // Check if manifestation already exists
    // ...
  });
}, [isLoaded, rituals, manifestations]);
```

**Interdependency**: Manifestations are created based on ritual properties
- Status doesn't prevent manifestation creation ✓

---

## Navigation Flow Analysis

### Path 1: Normal Tab Navigation
```
ritual/[id].tsx
  ↓ router.push('/log-ritual', {returnTo: '/(tabs)/rituals'})
log-ritual.tsx
  ↓ router.replace('/(tabs)/rituals')  on save
?(tabs)/rituals.tsx [Practice tab should be active]
```

**CRITICAL QUESTIONS**:
1. Does router.replace('/(tabs)/rituals') return to the Practice tab or Library tab?
2. Does it reset tabMode state or preserve it?
3. Does it cause component to re-render or just navigate?

**Default Tab State** (line 127):
```typescript
const [tabMode, setTabMode] = useState<TabMode>('library');
```
- Default is 'library'
- Tab state is local component state, not persisted

**Potential Issue**: When returning to rituals.tsx, if tabMode resets to 'library', the user won't see the practice tab and won't see the ritual at all, creating an illusion that status didn't update.

### Path 2: Navigation with Focus
```
When tab regains focus after router.replace():
- Component re-renders? (depends on React Navigation)
- Context is re-read? (should be automatic)
- Component state (tabMode) is reset? (might be)
- useEffect hooks run? (depends on dependencies)
```

**Missing**: No useFocusEffect hook in rituals.tsx to refresh when tab regains focus

---

## Hypothesis Testing

### Hypothesis 1: Tab State Reset
**Scenario**: router.replace() navigates to rituals tab, but component state resets
- tabMode resets from 'practice' to 'library'
- User sees empty/wrong tab
- Thinks status didn't update

**Evidence For**: Default is 'library', no state persistence
**Evidence Against**: User would explicitly navigate to practice tab and see it wasn't there

### Hypothesis 2: Missing Re-render
**Scenario**: router.replace() doesn't cause component to fully re-render with new context data
- Component is still mounted from before
- Context update doesn't propagate to this component
- UI doesn't refresh

**Evidence For**: No useFocusEffect to trigger refresh on focus
**Evidence Against**: useApp() hook should still work and trigger re-render

### Hypothesis 3: Filtered Out of View  
**Scenario**: Ritual is correctly marked as completed, but filtered out of the practice list
- Line 291 in rituals.tsx filters out completed as_needed rituals
- Ritual disappears from list after marking complete
- User can't see it to verify status change

**Evidence For**: Logic in filtered list specifically filters completed as_needed rituals
**Evidence Against**: This is intentional - completed rituals shouldn't show in "to do" list

---

## Data Consistency Check

### What should happen when ritual is completed:

1. **Context State**: ✓ ritual.status = 'completed'
2. **Persistence**: ✓ Saved to AsyncStorage
3. **Notifications**: ✓ Cancelled for the ritual
4. **Manifestations**: ✓ Unlock if they exist
5. **Display**: ✗ Should show check-circle, but shows check

### All Affected Systems:
- ✓ AppContext.tsx - Status update function
- ✓ AsyncStorage persistence
- ✓ Manifestation lock feature (depends on status)
- ✓ Notification cancellation (depends on status)
- ✗ UI display in Rituals tab (not showing updated status)

---

## Root Cause Candidates

### Priority 1: Tab Navigation
- [ ] router.replace() might not preserve tabMode state
- [ ] Component might not be fully re-rendering on navigation back
- [ ] Might need useFocusEffect to ensure refresh

### Priority 2: Tab State Reset
- [ ] When returning to Rituals tab, tabMode might reset to 'library'
- [ ] User sees wrong tab and thinks status didn't update

### Priority 3: List Filtering
- [ ] Completed as_needed rituals are intentionally filtered out of practice list
- [ ] This is by design, but user might not understand

### Priority 4: Context Update Timing
- [ ] State update might complete but not propagate to UI in time
- [ ] Race condition between navigation and state update

---

## Recommended Investigation Steps

1. **Verify tabMode Behavior**
   - When router.replace('/(tabs)/rituals') is called, does tabMode reset?
   - Should we persist tabMode to remember user's last active tab?

2. **Add Focus Effect**
   - Add useFocusEffect to rituals.tsx to refresh data when tab regains focus
   - This ensures data is fresh even if component wasn't fully unmounted

3. **Check Navigation Flow**
   - Verify router.replace() actually navigates to the correct tab/route
   - Check if router.back() might be better than router.replace()

4. **Add Debug Logging**
   - Log when rituals state changes in AppContext
   - Log when ritualsWithComputed recalculates
   - Log when component re-renders
   - Log when tab regains focus

---

## Summary

The ritual status IS being correctly updated in AppContext. The issue appears to be in how the Rituals tab component handles re-rendering and tab state after navigating back from log-ritual.

**Next Steps**:
1. Verify whether tabMode state is preserved or reset when navigating
2. Implement useFocusEffect if navigation focus isn't triggering re-renders
3. Test tab state management with persistent storage
4. Verify all dependencies are properly wired

