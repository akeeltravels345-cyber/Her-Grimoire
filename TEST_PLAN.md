# Grimoire UX/UI Testing Plan - Phases 1.1-3

## Phase 1.1: Toast Notification System

### Test: Ritual Creation Success Toast
- [ ] Navigate to "New Ritual"
- [ ] Fill in ritual details (name, intention, category)
- [ ] Click "Save"
- [ ] Verify toast appears with message: `"[Ritual Name] created!"`
- [ ] Toast should be green (success color)
- [ ] Toast should auto-dismiss after ~3 seconds
- [ ] Can manually dismiss by clicking X button

### Test: Library Save Toast
- [ ] Create a new ritual that's not in library
- [ ] After saving, library prompt appears
- [ ] Click "Save to Library"
- [ ] Verify toast shows: `"Added to library!"`
- [ ] Toast is green and auto-dismisses

### Test: Ritual Log Toast
- [ ] Open a ritual detail
- [ ] Click "Log Complete"
- [ ] Fill in moods and any notes
- [ ] Click "Save"
- [ ] Verify toast shows: `"[Ritual Name] logged!"`
- [ ] Toast is green (success)

### Test: Reflection Toast
- [ ] Open a ritual detail
- [ ] Click "Add Reflection"
- [ ] Add moods and notes
- [ ] Click "Save"
- [ ] Verify toast shows: `"Reflection saved!"`

### Test: Toast Gestures
- [ ] Create a toast
- [ ] Swipe upward on the toast
- [ ] Verify it dismisses with animation
- [ ] Try swipping downward - should NOT dismiss

### Test: Multiple Toasts
- [ ] Quickly trigger multiple actions (create ritual, log ritual, save to library)
- [ ] Verify multiple toasts stack at bottom
- [ ] Each should have proper spacing (offset 80px apart)
- [ ] Max 3 visible at once

---

## Phase 1.2: Manifestation Progress Indicator

### Test: Progress Bar Display
- [ ] Navigate to Cauldron/Manifestations
- [ ] Look for progress indicators on manifestation cards
- [ ] Verify progress bar shows percentage (e.g., "45%")
- [ ] Progress bar should be filled with purple theme color

### Test: Progress in Detail View
- [ ] Open a manifestation detail page
- [ ] Look for progress indicator
- [ ] Verify it matches the percentage shown in card
- [ ] Progress should animate smoothly

### Test: Progress Updates
- [ ] Create/log entries for a manifestation
- [ ] Check if progress bar updates
- [ ] Progress should increase as manifestation nears completion

---

## Phase 1.3: "Spilled" Manifestation Explanation

### Test: Spilled Status Badge
- [ ] Navigate to manifestations list
- [ ] Look for manifestations with "Spilled" status
- [ ] Should show a badge or indicator
- [ ] Badge should be visually distinct

### Test: Info Tooltip/Modal
- [ ] Locate a "Spilled" manifestation
- [ ] Look for an info icon (i) next to the status
- [ ] Tap/click the info icon
- [ ] A modal should open explaining what "Spilled" means
- [ ] Close the modal

### Test: Spilled Explanation Text
- [ ] Open manifestation detail for a spilled item
- [ ] Verify contextual help text explains the spilled status
- [ ] Text should be clear and user-friendly

---

## Phase 1.4: Loading States

### Test: Form Loading
- [ ] Open "New Ritual" form
- [ ] Watch for loading spinner while form initializes
- [ ] Fill in details and click "Save"
- [ ] Verify loading spinner appears during submission
- [ ] Verify button is disabled during loading
- [ ] Form navigates away after completion

### Test: Detail Page Loading
- [ ] Navigate to a ritual detail page
- [ ] Look for skeleton loaders while data loads
- [ ] Verify skeleton disappears when content loads
- [ ] Content should fade in smoothly

### Test: Journal Entry Loading
- [ ] Open log-ritual form
- [ ] Watch for loading spinner during initialization
- [ ] Fill in data and save
- [ ] Verify spinner appears during submission

### Test: Loading Animations
- [ ] All loading spinners should have smooth rotation animation
- [ ] Loading spinners should use app's primary color (purple)
- [ ] Skeleton loaders should have shimmer/pulse animation

---

## Phase 1.5: Improved Error Messages

### Test: Validation Error Toast
- [ ] Open "New Ritual" form
- [ ] Try to submit without filling required fields
- [ ] Verify error toast appears (red color)
- [ ] Error message should be specific (e.g., "Name is required")

### Test: Missing Category Error
- [ ] Open ritual form
- [ ] Try to submit without selecting a category
- [ ] Should see error: "At least one category required" (or similar)
- [ ] Save button should remain disabled

### Test: Missing Moods Error
- [ ] Open log-ritual form
- [ ] Try to submit without selecting mood
- [ ] Should see error toast: "At least one mood required"
- [ ] Save button should be disabled

### Test: Async Error Handling
- [ ] (If applicable) Trigger network/save error
- [ ] Verify error toast appears with helpful message
- [ ] Error should not crash app
- [ ] User can retry

### Test: Error Toast Styling
- [ ] All error toasts should be red color
- [ ] Should have error icon (X or warning)
- [ ] Should display for longer than success toasts (~4-5 seconds)

---

## Phase 2: Engagement Improvements

### Test: Streak Celebration
- [ ] Create a ritual and complete it daily
- [ ] After 7 consecutive completions, watch for streak celebration modal
- [ ] Modal should show: 🎊 "7-Day Streak!"
- [ ] Should have confetti animation
- [ ] Should have encouraging message
- [ ] Test at 7, 14, 30, 60 day milestones (if time permits)

### Test: Progress Charts
- [ ] Navigate to Practice Stats or Cauldron
- [ ] Look for historical progress charts
- [ ] Charts should show data over time (week/month view)
- [ ] Should display bar or line chart visualization
- [ ] Charts should be responsive and readable

### Test: Form Simplification
- [ ] Open "New Ritual" form
- [ ] Essential fields (name, intention, category) should be visible first
- [ ] Optional fields should be collapsible or in sections
- [ ] Can expand/collapse sections smoothly
- [ ] Form should feel less overwhelming

### Test: Color Validation
- [ ] Navigate to category or deity management
- [ ] Look for color picker when creating/editing
- [ ] Should show color preview
- [ ] Selected colors should have visual feedback (checkmark or highlight)
- [ ] Color should validate (no bad color values)

---

## Phase 3: Polish Layer

### Test: Achievement Badges
- [ ] Complete first ritual - watch for "First Ritual" achievement notification
- [ ] Complete 50 rituals - watch for achievement badge
- [ ] Look for badge display in profile or stats
- [ ] Achievements should have animations and icons
- [ ] Toast notification when achievement unlocked

### Test: Push Notifications (if implemented)
- [ ] Create scheduled ritual for tomorrow
- [ ] Check if push notification appears at scheduled time
- [ ] Notification should show ritual name and time
- [ ] Tap notification to open ritual detail

### Test: Data Visualization
- [ ] Go to dashboard/stats
- [ ] Look for pie charts (category distribution)
- [ ] Look for timeline of manifestations
- [ ] Visual should be clear and informative
- [ ] Should update in real-time

### Test: Accessibility - Color Contrast
- [ ] Check all text for readability
- [ ] Primary text should have sufficient contrast on backgrounds
- [ ] Toast messages should be readable
- [ ] Error messages should stand out

### Test: Accessibility - Screen Reader
- [ ] Enable screen reader (VoiceOver on iOS, TalkBack on Android)
- [ ] Navigate through screens
- [ ] Buttons and interactive elements should be announced
- [ ] Form fields should be labeled and announced

### Test: Accessibility - Keyboard Navigation
- [ ] Navigate entire app using keyboard
- [ ] All buttons should be reachable via tab
- [ ] Modal focus should trap correctly
- [ ] No keyboard traps (stuck elements)

---

## General Testing

### Performance
- [ ] App should not lag when showing toasts
- [ ] Loading animations should be smooth (60fps)
- [ ] Navigation between screens should be fluid
- [ ] No jank or stutter in animations

### Theme Consistency
- [ ] All new components use purple theme
- [ ] Toast success = green (#7ed4a8)
- [ ] Toast error = red (#ff6b6b)
- [ ] Loading spinners = purple
- [ ] Progress bars = purple

### Navigation
- [ ] All toasts/modals don't block navigation
- [ ] Back button works while toasts visible
- [ ] Can navigate away from loading states

---

## Testing Summary

Total Tests: ~50+
Priority: All phases should be working for UX score improvement
Target: Design score 6.5 → 8.5

Once testing complete, note:
- ✅ What works well
- ⚠️ What needs refinement
- ❌ What's broken
