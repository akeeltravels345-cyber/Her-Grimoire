# Multi-Select Categories & Moods - Test Plan

## Summary of Changes
Rituals now support multiple categories (1-3) and journal entries support multiple moods (1+), replacing the previous single-select constraints. All legacy data automatically migrates to array format on app load.

## Core Features Implemented

### 1. Data Structures ✅
- `Ritual.categories: string[]` (replaces single `category`)
- `JournalEntry.moods: string[]` (replaces single `mood`)
- `LibraryRitual.categories: string[]` (replaces single `category`)
- `ManifestationRecord.categories: string[]` (replaces single `category`)
- Backward compatible: legacy fields still present for migration

### 2. Data Migration ✅
- Automatic conversion on app load: `{category: "x"}` → `{categories: ["x"]}`
- Automatic conversion on app load: `{mood: "y"}` → `{moods: ["y"]}`
- Graceful fallback: displays first category/mood if array is empty
- No data loss during migration

### 3. UI Components ✅

#### Add/Edit Ritual Form (add-ritual.tsx)
- Multi-select category chips with checkmark indicators
- Counter showing "X of 3" selected
- Min 1, max 3 constraint enforced
- Visual feedback: highlighted background + checkmark

#### Add/Edit Library Ritual Form (add-library-ritual.tsx)
- Multi-select category chips identical to add-ritual
- Min 1, max 3 constraint enforced
- Consistent UI across both forms

#### Log Ritual/Mood Form (log-ritual.tsx)
- Multi-select mood pills (no maximum)
- Min 1 mood required
- Checkmark indicators for selected moods
- Text label updated to "select one or more"

#### Ritual Detail View (ritual/[id].tsx)
- Display all categories as individual tags (not just first one)
- Edit mode: multi-select category picker with same constraints as add-ritual
- Journal entries show all moods from each entry
- Moods display in row with wrapping

#### Manifestation Detail View (manifestation/[id].tsx)
- New "EMOTIONAL RESONANCE" section
- Shows all moods from latest journal entry
- Displays as pills with category-based color
- Gracefully handles legacy single-mood entries

#### Practice Tab Views (rituals.tsx)
- Week view: shows primary category + "+X" indicator if more exist
- Month view: rituals filtered by any matching category
- Library list: same display as week view
- Category filter counts all rituals that have the category

#### Add to Practice (add-to-practice.tsx)
- Handles multi-category library rituals correctly
- Passes all categories when creating practice instance

---

## Test Checklist

### Data Migration
- [ ] Create new ritual with multiple categories → verify array format in storage
- [ ] Close/reopen app → categories persist
- [ ] Manually add old-format ritual to storage → auto-migrates on load
- [ ] Verify no data loss after migration
- [ ] Create new journal entry with moods → stored as array
- [ ] Old entries with single mood → display correctly

### Multi-Select Categories (Forms)

#### Add Ritual Form
- [ ] Select 1 category (minimum) → button enabled
- [ ] Select 2 categories → counter shows "2 of 3"
- [ ] Select 3 categories (maximum) → button disabled for 4th
- [ ] Try to deselect only category → prevented
- [ ] Deselect with 2+ selected → allowed
- [ ] Save ritual with 2 categories → stored correctly
- [ ] Edit ritual → both categories pre-selected
- [ ] Add/remove categories in edit mode → saved correctly

#### Add Library Ritual Form
- [ ] All above tests apply identically
- [ ] Multi-category library ritual created
- [ ] "Add to Practice" flow works with multi-category rituals

### Multi-Select Moods (Logging)

#### Log Ritual Form
- [ ] Select 1 mood (minimum) → button enabled
- [ ] Select 2 moods → both appear in list
- [ ] Select 5+ moods (no max) → all visible, no limit reached
- [ ] Try to deselect only mood → prevented
- [ ] Deselect with 2+ selected → allowed
- [ ] Save entry with 3 moods → stored correctly
- [ ] Journal shows all moods, not just first
- [ ] Moods wrap properly on small screens

### Display & Filtering

#### Ritual Detail View
- [ ] Shows all categories as separate tags (not "+" indicator)
- [ ] Edit mode: all categories pre-selected
- [ ] Can change categories (add/remove/swap)
- [ ] Journal entries show all moods (not just first)

#### Manifestation Detail
- [ ] "EMOTIONAL RESONANCE" section appears
- [ ] Shows all moods from latest journal entry
- [ ] Moods display as colored pills
- [ ] Legacy single-mood entries display correctly

#### Week View / Calendar
- [ ] Rituals show primary category + "+X" if more
- [ ] Clicking ritual opens detail (shows all categories)
- [ ] Category filter works with multi-category rituals
- [ ] Category counts include all rituals with that category

#### Library / Practice Lists
- [ ] Library rituals show primary + "+X"
- [ ] Multi-category rituals can be added to practice
- [ ] Practice list shows categories correctly

### Edge Cases

- [ ] Empty categories array → defaults to first value gracefully
- [ ] User selects same category twice → prevented (no duplicates)
- [ ] Switch between add-ritual and add-library → state isolated
- [ ] Rapidly toggle categories → no UI glitches
- [ ] Add ritual with 2 categories, edit to 3 → works
- [ ] Create ritual with max (3), create another with 1 → both work
- [ ] Journal entry: add moods, edit, add more → all saved

### Backward Compatibility

- [ ] Old single-category ritual loads → shows category correctly
- [ ] Old single-mood entry loads → displays in ritual detail
- [ ] Edit old ritual → can now add more categories
- [ ] Edit old entry → can now add more moods
- [ ] Manifestation linked to old ritual → works normally

### Performance

- [ ] Large number of rituals with varying categories → no lag
- [ ] Category filter with 50+ rituals → responsive
- [ ] Week view renders quickly with multi-category rituals
- [ ] Edit mode doesn't stall when selecting categories

---

## Known Constraints

1. **Categories**: min 1, max 3 per ritual
2. **Moods**: min 1, no maximum per entry
3. **Display**: Week view shows primary + "+X", full tags in detail
4. **Migration**: Automatic and seamless on first app load
5. **Backward Compatibility**: Legacy single fields still read/written for transition

---

## Files Modified

### Core Data
- `services/mockData.ts` - Updated interfaces

### Context & Logic
- `contexts/AppContext.tsx` - Migration logic, data handling

### Forms
- `app/add-ritual.tsx` - Multi-select categories
- `app/add-library-ritual.tsx` - Multi-select categories
- `app/log-ritual.tsx` - Multi-select moods
- `app/add-to-practice.tsx` - Multi-category handling

### Display Components
- `app/ritual/[id].tsx` - Multi-category display & edit
- `app/manifestation/[id].tsx` - Multi-mood display
- `app/(tabs)/rituals.tsx` - Category filtering & display

### Styling
- All components: styles added for multi-select UI (checkmarks, counters, etc.)

---

## Test Execution

### Quick Smoke Test (5 min)
1. [ ] App loads without errors
2. [ ] Create ritual with 2 categories → verify saved
3. [ ] Edit ritual → verify categories pre-selected
4. [ ] Log entry with 2 moods → verify saved & displayed
5. [ ] View manifestation → verify moods shown

### Comprehensive Test (30 min)
- Follow all items in "Test Checklist" above
- Test on both iOS and Android if possible
- Verify on various screen sizes

### Regression Test (15 min)
- Load old save file with single-category rituals
- Verify categories migrated
- Perform normal operations (edit, log, view)
