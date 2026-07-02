# How to Test the Undo Spill Feature

## Step-by-Step Guide

### Step 1: Navigate to a Ritual
1. Open the app (now skips onboarding)
2. Go to **Rituals** tab
3. Tap on any existing ritual to open it
   - If you don't have one, you'll need to create one first from the Home tab

### Step 2: Log a Sign First
1. On the ritual detail page, look for **"Log a Sign"** button or similar
2. Tap it to add a manifestation entry
3. Select a sign type (Dream 🌙, Omen 🦅, Encounter 👁️, etc.)
4. Enter a description: "I had a vivid dream about..."
5. Click **Save**
6. This creates a manifestation in "brewing" → "stirring" status

### Step 3: Trigger the Celebration Modal
1. Still on the ritual detail page
2. Tap **"Log a Sign"** again (or similar button for adding manifestation)
3. At the top, toggle to **"⭐ It Spilled"** mode (should change from the sign selector)
4. Enter what manifested: "And then it actually happened!"
5. Click **Save**

### Step 4: See the Undo Button
**The celebration modal appears with:**
- ✨ "Your Wish Manifested!" title
- Stats showing days elapsed and signs logged
- The ritual name in a card
- A reflection prompt section
- **"Undo (5s)" button** at the bottom ← THIS IS WHAT YOU'RE LOOKING FOR

The button shows:
- 🔄 Undo icon
- "Undo (5s)" text
- Countdown from 5 to 0
- Semi-transparent purple background

### Step 5: Click Undo (Within 5 Seconds!)
1. **Quickly tap the "Undo (5s)" button** while it's still visible
2. The button is positioned above the "Return to Cauldron" button
3. You'll see the modal close with success haptic feedback
4. The manifestation returns to "stirring" status (with the signs still logged)
5. The spill is removed

### Step 6: Verify It Worked
1. Go back to the ritual
2. Check the manifestation - it should show the signs but **not** marked as spilled
3. The spill entry should be gone from history

---

## Where to Find the Undo Button

### On the Celebration Modal:

```
┌─────────────────────────────────────┐
│                                     │
│  ✨ Your Wish Manifested!           │
│     into Reality                    │
│                                     │
│  📊 Stats showing days & signs      │
│  ✨ SPELL CAST - ritual name        │
│  ✍️ Quick Reflection prompt          │
│                                     │
├─────────────────────────────────────┤
│  🔄 Undo (5s)  ← YOU ARE HERE       │  ← Visible for 5 seconds only
├─────────────────────────────────────┤
│  ▶ Return to Cauldron               │
└─────────────────────────────────────┘
```

---

## Timing is Critical!

⏱️ **The undo button only shows for 5 seconds:**
- After 5 seconds: Button disappears
- After button disappears: Spill becomes permanent
- Can't undo after countdown ends (must re-mark as unspilled manually)

---

## If You Don't See the Undo Button

### Possible Issues:

**1. Celebration Modal Isn't Appearing**
- Make sure you're using "⭐ It Spilled" mode (not "Log a Sign")
- Make sure you've entered text in the description field
- The Save button might be disabled if field is empty

**2. Button Is Hidden**
- Scroll down on the celebration modal
- The button is positioned at the bottom, above "Return to Cauldron"
- It has a semi-transparent purple background (theme.primary + '15')

**3. Five Seconds Already Passed**
- If you're reading this after opening the modal, the button might have disappeared
- Create another spill and click Undo immediately

**4. No Manifestation History**
- You need at least one sign logged before you can test the spill
- Create a manifestation with sign first, then come back and spill it

---

## Complete Testing Scenario

```
1. Home Tab → Look for ritual or create one
2. Open a ritual
3. Add Manifestation → Select a sign type (Dream, Omen, etc.)
   - Enter: "Had a dream about the intention"
   - Save
4. Add Manifestation Again → Toggle to "⭐ It Spilled"
   - Enter: "And then it happened in real life!"
   - Save
5. 🎉 Celebration modal appears!
6. Look for: 🔄 "Undo (5s)" button
7. Click it quickly (within 5 seconds)
8. Modal closes with success feedback
9. Go back to ritual
10. Verify: Signs still there, but spill gone
```

---

## Visual Clues to Look For

### Before Spill:
- Manifestation shows as "stirring" (🌟 status)
- List of individual signs logged: Dream, Omen, etc.
- No "spilled" marker

### After Spill (Before Undo):
- "Your Wish Manifested!" celebration modal
- Confetti emoji background
- Stats: days elapsed, signs logged
- Undo button at bottom (5s countdown)

### After Undo Succeeds:
- Modal closes
- Haptic feedback (vibration/buzz)
- Back to ritual view
- Manifestation now shows as "stirring" again
- No "spilled" entry in history

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't find ritual | Go to Home → Create a new ritual first |
| Save button is greyed out | Enter text in the description field |
| Don't see "⭐ It Spilled" toggle | Make sure you're in Add Manifestation screen |
| Modal appears but no undo button | Scroll down, button is at bottom |
| Undo button already disappeared | Open a new manifestation and spill again |
| Nothing happens when clicking undo | 5 seconds may have passed, try again |

---

## What You Should See

### Undo Button Appearance:
- Location: Bottom of celebration modal, above "Return to Cauldron"
- Style: Transparent purple (background: `theme.primary + '15'`)
- Icon: 🔄 Undo arrow (MaterialIcons)
- Text: "Undo (5s)" with countdown
- Border: Subtle 1.5px border with primary color

### Button Animation:
- Appears when modal opens: ✅ visible
- Counts down: 5s → 4s → 3s → 2s → 1s → 0s
- After 5s: ❌ disappears (display: none)

---

## Questions?

If you still can't find it:
1. Check `components/CelebrationModal.tsx` lines 228-240 (undo button code)
2. Check `app/add-manifestation.tsx` lines 53-61 (celebration modal trigger)
3. Verify celebration modal is rendering by looking for "Your Wish Manifested!" text
4. Verify undo button styling in `CelebrationModal.tsx` lines 481-500

