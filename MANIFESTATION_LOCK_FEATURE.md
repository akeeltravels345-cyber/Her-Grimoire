# Manifestation Lock Feature

## Overview

When a ritual is added to the practice schedule, it automatically creates a manifestation record in the Cauldron. This feature prevents users from editing or interacting with that manifestation until the ritual has been properly logged as completed.

---

## What Gets Locked?

When a manifestation is in "locked" state, the following interactions are disabled:

1. **"Log a Sign" button** - Cannot add new signs/dreams/omens
2. **"⭐ It Spilled" button** - Cannot mark as manifested
3. **Edit intention button** - Cannot edit the intention/tangible outcome
4. **Delete sign buttons** - Cannot remove previously logged signs

---

## Lock Logic

### For As-Needed Rituals
- **Locked until**: `ritual.status === 'completed'`
- **Unlock message**: "Log this ritual as complete to add signs and manifest"
- User must click "Log Complete" on the ritual detail page first

### For Multi-Day Rituals (Daily, Weekly, Monthly, Moon Phase)
- **Locked until**: First entry has been logged (`ritual.timesPerformed > 0` or `ritual.journal.length > 0`)
- **Unlock message**: "Log your first entry to start tracking signs"
- User must log at least one journal entry for the ritual first

---

## Implementation Details

### File Modified
- `app/manifestation/[id].tsx`

### Logic Added

**Lock Detection** (lines 58-66):
```typescript
const isLocked = ritual && !ritual.status && ritual.schedule !== 'as_needed'
  ? ritual.timesPerformed === 0 && ritual.journal.length === 0  // Multi-day
  : ritual?.status !== 'completed';  // As-needed

const lockMessage = ritual?.schedule === 'as_needed'
  ? 'Log this ritual as complete to add signs and manifest'
  : 'Log your first entry to start tracking signs';
```

**UI Rendering** (lines 325-346):
- Shows locked state with lock icon and message
- Hides action buttons when locked
- Shows buttons only when unlocked

**Button Disabling**:
- Edit button: Made greyed out and disabled
- Delete buttons: Made semi-transparent and disabled
- Action buttons: Replaced with lock message

---

## User Experience

### Before Ritual is Completed

**Manifestation View (Locked)**:
```
┌─────────────────────────────────┐
│ The Cauldron                    │ (edit button greyed out)
│ My Important Ritual             │
├─────────────────────────────────┤
│                                 │
│ Status: Brewing 🪄              │
│ Days Active: 1                  │
│ Created: May 25, 2026           │
│                                 │
│ No signs logged yet.            │
│                                 │
├─────────────────────────────────┤
│                                 │
│ 🔒 Log this ritual as complete  │
│    to add signs and manifest    │
│                                 │
└─────────────────────────────────┘
```

### After Ritual is Completed

**Manifestation View (Unlocked)**:
```
┌─────────────────────────────────┐
│ The Cauldron                    │ (edit button active)
│ My Important Ritual             │
├─────────────────────────────────┤
│                                 │
│ Status: Stirring 🌊             │
│ Days Active: 1                  │
│ Created: May 25, 2026           │
│                                 │
│ No signs logged yet.            │
│                                 │
├─────────────────────────────────┤
│                                 │
│ [Log a Sign]  [⭐ It Spilled]    │
│                                 │
└─────────────────────────────────┘
```

---

## Workflow

### For As-Needed Rituals

```
1. User adds ritual to schedule
   ↓
2. Manifestation auto-created (LOCKED)
   ↓
3. User opens ritual detail page
   ↓
4. Clicks "Log Complete"
   ↓
5. Fills journal entry and saves
   ↓
6. Ritual status → 'completed'
   ↓
7. Returns to Rituals tab
   ↓
8. User opens Cauldron → Manifestation now UNLOCKED
   ↓
9. Can add signs, edit intention, mark as spilled
```

### For Multi-Day Rituals

```
1. User adds recurring ritual (Daily, Weekly, etc.)
   ↓
2. Manifestation auto-created (LOCKED)
   ↓
3. User opens ritual instance
   ↓
4. Clicks "Log" to log completion
   ↓
5. Fills journal entry and saves
   ↓
6. Ritual.timesPerformed incremented
   ↓
7. Manifestation automatically UNLOCKED
   ↓
8. Can add signs, edit intention, mark as spilled
```

---

## Visual Indicators

### Locked State
- **Icon**: 🔒 Lock icon
- **Button**: Greyed out background
- **Message**: Guiding text explaining what to do
- **Edit Button**: Changed to `theme.textMuted` color, semi-transparent

### Unlocked State
- **Buttons**: Bright, interactive appearance
- **Edit Button**: Normal color and opacity
- **Delete Buttons**: Fully visible and clickable

---

## Code Changes Summary

| Component | Change | Purpose |
|-----------|--------|---------|
| Lock detection logic | Added `isLocked` variable | Determines if manifestation is locked |
| Lock message | Added `lockMessage` variable | Shows appropriate message for ritual type |
| Action buttons | Conditional rendering | Shows either buttons or lock message |
| Edit button | Disabled when locked | Prevents editing when locked |
| Delete buttons | Disabled when locked | Prevents result deletion when locked |
| Styles | Added `lockedContainer`, `lockedText` | Styles for locked state display |

---

## Testing Scenarios

### Scenario 1: As-Needed Ritual
- [ ] Add as_needed ritual with tangible outcome
- [ ] Open Cauldron → manifestation shows lock message
- [ ] Edit button is greyed out
- [ ] Click "Log a Sign" → nothing happens (button disabled)
- [ ] Open ritual detail
- [ ] Click "Log Complete"
- [ ] Fill journal and save
- [ ] Return to Cauldron
- [ ] Verify manifestation is now unlocked
- [ ] "Log a Sign" button is now active

### Scenario 2: Multi-Day Ritual (Daily)
- [ ] Add daily recurring ritual with tangible outcome
- [ ] Open Cauldron → manifestation shows lock message
- [ ] Edit button is greyed out
- [ ] Open ritual instance
- [ ] Click "Log" button
- [ ] Fill journal and save
- [ ] Manifestation automatically unlocks
- [ ] "Log a Sign" and "⭐ It Spilled" buttons now active

### Scenario 3: Can Still View When Locked
- [ ] Locked manifestation shows:
  - [ ] Intention text (readable but not editable)
  - [ ] Category and date info
  - [ ] Status and progress
  - [ ] Empty signs timeline message
- [ ] All display elements work normally
- [ ] Only interactive elements are disabled

---

## Design Rationale

### Why Lock Manifestations?

1. **Prevent Premature Marking**: Users won't accidentally mark manifestations as spilled before the ritual is completed
2. **Encourage Completion**: Guides users to complete the ritual first
3. **Data Integrity**: Ensures manifestations only track signs for actually-performed rituals
4. **Better UX**: Clear messaging about what needs to happen next

### Why Different Logic for Ritual Types?

- **As-Needed**: Must complete the specific instance (status = completed)
- **Multi-Day**: Just needs one logged entry to know the pattern has started (timesPerformed > 0)

This reflects real usage: multi-day rituals can have manifestations tracked across multiple instances, while as-needed rituals are one-off events.

---

## Edge Cases Handled

✅ Ritual doesn't exist (manifests gracefully)  
✅ User has multi-day ritual with journal but not spilled (unlocked properly)  
✅ User marks as_needed as spilled, then tries to edit (locked until status re-set)  
✅ Multi-day ritual completed multiple times (stays unlocked)  
✅ Edit intention works when unlocked, disabled when locked  
✅ Results deletion respects lock state  

---

## Future Enhancements

1. **Visual feedback on ritual page**: Show indicator that manifestation is locked
2. **Quick unlock link**: "Open manifestation" button in locked state
3. **Per-instance tracking**: Allow separate manifestation tracking for multi-day rituals
4. **Lock history**: Track when manifestation was unlocked
5. **Unlock animations**: Celebrate unlocking with animation/confetti

---

## Performance Notes

- Lock detection is O(1) - just checking ritual status/counts
- No additional queries or state management needed
- Works with existing manifestation filtering system
- No impact on manifestation creation or cleanup

