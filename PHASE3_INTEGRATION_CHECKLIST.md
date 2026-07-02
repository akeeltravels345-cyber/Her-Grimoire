# Phase 3: Polish Layer - Integration Checklist

## Quick Start

Follow this checklist to integrate Phase 3 polish features into your app.

---

## Achievement Badges System

### Component Setup
- [x] Created `components/AchievementBadge.tsx`
- [x] Created `components/AchievementsScreen.tsx`
- [x] Created `components/AchievementUnlockedToast.tsx`
- [x] Created `services/achievementService.ts`

### AppContext Integration
- [ ] Add `achievements` state to AppContext
- [ ] Add `unlockedAchievements` state to AppContext
- [ ] Add `newlyUnlockedAchievement` state to AppContext
- [ ] Create `markAchievementUnlocked` method
- [ ] Add useEffect to calculate achievements on data changes
- [ ] Load `unlockedAchievements` from AsyncStorage on app start
- [ ] Save `unlockedAchievements` to AsyncStorage on unlock
- [ ] Add `ACHIEVEMENTS_KEY` to AsyncStorage keys

### Dashboard Integration
- [ ] Import AchievementBadge component
- [ ] Import AchievementUnlockedToast component
- [ ] Add achievements section to dashboard
- [ ] Add toast component to layout
- [ ] Create button/link to full achievements screen (optional)

### Navigation
- [ ] (Optional) Add Achievements tab to bottom navigation
- [ ] (Optional) Add achievements route to Stack navigation

### Testing
- [ ] Complete first ritual - verify "First Step" badge
- [ ] Complete 5 rituals - verify "Rising Practitioner" badge
- [ ] Check achievement unlock toast notification
- [ ] Test achievement details modal
- [ ] Test achievement filter toggle
- [ ] Test on multiple devices for animation smoothness

---

## Enhanced Notifications System

### Service Setup
- [x] Created `services/notificationService.ts`
- [x] Added expo-notifications package (already in package.json)
- [x] Added expo-device package (already in package.json)

### App Initialization
- [ ] Call `NotificationService.initialize()` in app startup
- [ ] Handle notification permission requests
- [ ] Set up notification handlers in app root

### Ritual Reminders
- [ ] Update `addRitual` method to schedule notification
- [ ] Update `updateRitual` method to update notification on date change
- [ ] Update `deleteRitual` method to cancel notification
- [ ] Store `notificationId` in ritual object (or separate mapping)

### Daily Motivation
- [ ] Call `NotificationService.scheduleDailyMotivation()` on first app launch
- [ ] Create settings UI for notification time preference
- [ ] Allow users to enable/disable daily notifications

### Achievement Notifications
- [ ] Call `NotificationService.sendAchievementNotification()` when achievement unlocks
- [ ] Pass achievement title and description
- [ ] Handle notification tap to navigate to achievements

### Notification Response Handling
- [ ] Set up `Notifications.addNotificationResponseListener`
- [ ] Route to appropriate screen based on notification data
- [ ] Clean up subscription on component unmount

### Testing
- [ ] Schedule a test ritual for 30 seconds from now
- [ ] Verify notification appears in notification center
- [ ] Verify notification sound plays
- [ ] Verify notification badge increments
- [ ] Test notification tap navigation
- [ ] Verify daily motivation appears at scheduled time
- [ ] Test on physical device (simulators may not show notifications)

---

## Data Visualization

### Component Setup
- [x] Created `components/DataVisualization.tsx`

### Dashboard Integration
- [ ] Import DataVisualization component
- [ ] Add to dashboard or create dedicated analytics screen
- [ ] Pass rituals, categories, categoryColors, manifestations props

### Analytics Screen (Optional)
- [ ] Create `app/(tabs)/analytics.tsx`
- [ ] Add to tab navigation with analytics icon
- [ ] Ensure proper data is passed from context

### Features Verification
- [ ] Category progress bar chart displays correctly
- [ ] Manifestation status pie chart shows data
- [ ] Manifestation timeline displays recent items
- [ ] Overall statistics cards show correct numbers
- [ ] Empty state displays when no data
- [ ] Charts are horizontally scrollable
- [ ] Legend is accessible and readable

### Testing
- [ ] Add several rituals with different categories
- [ ] Complete some rituals and verify completion rate
- [ ] Create manifestations with different statuses
- [ ] Verify category progress sums correctly
- [ ] Test with varying amounts of data (0, 1, many items)
- [ ] Verify colors match category colors
- [ ] Test on small and large screens

---

## Accessibility Audit & Improvements

### Service Setup
- [x] Created `services/accessibilityService.ts`

### Color Contrast Validation
- [ ] Audit all component text colors vs backgrounds
- [ ] Ensure primary text is 4.5:1 minimum (WCAG AA)
- [ ] Ensure secondary text has sufficient contrast
- [ ] Use `AccessibilityService.getContrastLevel()` to verify

### Screen Reader Support
- [ ] Add `accessible={true}` to all interactive components
- [ ] Add proper `accessibilityRole` to all components
- [ ] Add descriptive `accessibilityLabel` to all buttons/links
- [ ] Add `accessibilityHint` to complex interactions
- [ ] Add `accessibilityLabel` to all images/icons
- [ ] Test with VoiceOver (iOS) or TalkBack (Android)

### Keyboard Navigation
- [ ] Test tabbing through all interactive elements
- [ ] Verify tab order is logical
- [ ] Verify focus states are visible
- [ ] Test with external keyboard
- [ ] Ensure no keyboard traps

### Touch Targets
- [ ] Verify all buttons are at least 44x44 points
- [ ] Verify adequate spacing between touch targets
- [ ] Use `AccessibilityService.meetsMinimumTouchTarget()` to validate

### Semantic Structure
- [ ] Use `AccessibilityService.getSemanticComponentProps()` for component setup
- [ ] Verify proper heading hierarchy
- [ ] Verify proper nesting of components
- [ ] Test with accessibility inspector

### Testing Devices
- [ ] Test on iPhone with VoiceOver enabled
- [ ] Test on Android with TalkBack enabled
- [ ] Test with text scaling enabled
- [ ] Test with reduced motion enabled
- [ ] Test with high contrast mode enabled

### Accessibility Audit Report
- [ ] Generate audit report using `generateAuditReport()`
- [ ] Fix all error-level issues
- [ ] Address warning-level issues if possible
- [ ] Document info-level items

---

## File Organization

### New Components (Place in `/components`)
```
components/
├── AchievementBadge.tsx
├── AchievementsScreen.tsx
├── AchievementUnlockedToast.tsx
└── DataVisualization.tsx
```

### New Services (Place in `/services`)
```
services/
├── achievementService.ts
├── notificationService.ts
└── accessibilityService.ts
```

### Update Existing Files
```
contexts/
└── AppContext.tsx (add achievement tracking)

app/(tabs)/
└── index.tsx (add achievement display, data viz, toast)
└── _layout.tsx (initialize notifications)
```

---

## Quick Integration Example

```typescript
// In AppContext.tsx

import { AchievementService } from '../services/achievementService';
import { NotificationService } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = 'grimoire_achievements';

// In AppProvider:
const [achievements, setAchievements] = useState<Achievement[]>([]);
const [unlockedAchievements, setUnlockedAchievements] = useState<Record<AchievementType, string | undefined>>({});
const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<Achievement | null>(null);

// On mount:
useEffect(() => {
  // Initialize notifications
  NotificationService.initialize();
  
  // Load unlocked achievements
  const loadAchievements = async () => {
    const saved = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) setUnlockedAchievements(JSON.parse(saved));
  };
  loadAchievements();
}, []);

// When data changes:
useEffect(() => {
  const newAchievements = AchievementService.calculateAchievements(
    rituals,
    manifestations,
    standaloneEntries,
    unlockedAchievements
  );
  
  const newlyUnlocked = AchievementService.getNewlyUnlockedAchievements(
    newAchievements,
    unlockedAchievements
  );
  
  if (newlyUnlocked.length > 0) {
    const first = newlyUnlocked[0];
    setNewlyUnlockedAchievement(first);
    
    // Send notification
    NotificationService.sendAchievementNotification(first.title, first.description);
    
    // Save unlocked
    const updated = { ...unlockedAchievements };
    newlyUnlocked.forEach(a => {
      updated[a.id] = new Date().toISOString();
    });
    setUnlockedAchievements(updated);
    AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
  }
  
  setAchievements(newAchievements);
}, [rituals, manifestations, standaloneEntries, unlockedAchievements]);
```

---

## Troubleshooting

### Achievements Not Showing
- [ ] Verify AppContext state is set up correctly
- [ ] Check that `achievements` and `unlockedAchievements` are passed to context
- [ ] Verify `AchievementService.calculateAchievements()` returns data
- [ ] Check AsyncStorage has `ACHIEVEMENTS_KEY` entry

### Notifications Not Working
- [ ] Ensure `NotificationService.initialize()` was called
- [ ] Check notification permissions are granted
- [ ] Verify testing on physical device (not simulator)
- [ ] Check that notification content has required fields
- [ ] Verify `notificationId` is stored correctly

### Accessibility Issues
- [ ] Run audit using `AccessibilityService.auditComponentAccessibility()`
- [ ] Fix error-level issues first (contrast, labels)
- [ ] Test with screen reader enabled
- [ ] Check focus states are visible
- [ ] Verify touch targets are large enough

### Performance Issues
- [ ] Check that achievement calculation is memoized
- [ ] Verify notification scheduling is async
- [ ] Check that animations use native driver
- [ ] Profile with React DevTools

---

## Verification Checklist

Before marking as complete:

- [ ] All new files created and properly typed
- [ ] All imports resolve correctly
- [ ] No TypeScript errors
- [ ] Components render without errors
- [ ] Achievements unlock on expected triggers
- [ ] Notifications appear and navigate correctly
- [ ] Data visualizations display accurate information
- [ ] All interactive elements are accessible
- [ ] Color contrast passes WCAG AA standards
- [ ] Screen reader support verified
- [ ] Keyboard navigation works
- [ ] Performance is acceptable
- [ ] No memory leaks
- [ ] Tested on multiple devices/screen sizes

---

## Estimated Implementation Time

- Achievement Badges System: 1-2 hours
- Enhanced Notifications: 1-2 hours
- Data Visualization: 1-2 hours
- Accessibility Audit & Fixes: 2-4 hours
- Testing & Verification: 2-3 hours

**Total: 7-13 hours of development work**

---

## Support & Documentation

For detailed implementation information, see:
- `PHASE3_POLISH_IMPLEMENTATION.md` - Comprehensive guide
- Component source files - Well-documented with JSDoc
- Service files - Detailed method documentation

For accessibility resources:
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- React Native Accessibility: https://reactnative.dev/docs/accessibility
- iOS VoiceOver Testing: https://www.apple.com/accessibility/voiceover/
- Android TalkBack Testing: https://support.google.com/accessibility/android/answer/6283677
