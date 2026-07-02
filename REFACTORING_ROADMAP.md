# Grimoire Refactoring Roadmap

## ✅ Tier 1 - COMPLETED (45 replacements + component extraction)

### Achievements
- **dateHelpers Integration**: Centralized 45 toLocaleDateString calls across 13 screens
- **Date Formatting Helpers**: Created 10 reusable functions for common date patterns
- **IconColorGrid Component**: Extracted duplicated icon/color selection UI
- **Code Reduction**: Removed 12 lines of duplicate styles across 2 files
- **Maintainability**: Future date format changes now require 1 edit instead of 45

**Files Modified**: 15  
**Total Lines Changed**: ~250+  
**Refactoring Time**: ~2.5 hours

---

## 🔄 Tier 2 - IMAGE & MODAL CONSOLIDATION (In Progress - 50%)

### Part 1: Image Upload Consolidation - MOSTLY COMPLETE ✅

**Current State:**
- ✅ ImageField component created with support for dynamic upload labels
- ✅ add-ritual.tsx updated to use ImageField
- ✅ log-ritual.tsx updated to use ImageField  
- ✅ add-manifestation.tsx updated to use ImageField
- ✅ add-library-ritual.tsx featured image updated to use ImageField
- ✅ write-journal.tsx updated to use ImageField
- ✅ library-ritual/[id].tsx featured image updated to use ImageField with dynamic "Replace Image" label
- ⏳ profile.tsx - skipped (preview modal workflow is more complex)
- ⏳ add-library-ritual.tsx reference images - kept as-is (array management)
- ⏳ library-ritual/[id].tsx reference images - kept as-is (array management)

**Files Affected:**
- add-ritual.tsx (imageUrl state + ImageUploadButton)
- log-ritual.tsx (imageUrl state + ImageUploadButton)
- add-manifestation.tsx (imageUrl state + ImageUploadButton)
- add-library-ritual.tsx (imageUrl + referenceImages states)
- profile.tsx (profileImage state)
- write-journal.tsx (image state)
- library-ritual/[id].tsx (image editing)
- add-to-practice.tsx (potential image support)

**Consolidation Strategy:**
1. Enhance useForm hook to handle image field types with preview logic
2. Create ImageField component that wraps image upload + preview + removal
3. Replace 8+ instances of manual image handling with ImageField
4. Centralize image validation rules in validationHelpers
5. **Expected savings**: ~80-100 lines of duplicate code

**Implementation Plan:**
```
Step 1: Extend useForm hook → image field support with preview callback
Step 2: Create ImageField component → wraps ImageUploadButton + preview + removal
Step 3: Update add-ritual.tsx → use ImageField(imageUrl)
Step 4: Update log-ritual.tsx → use ImageField(imageUrl)
Step 5: Update add-manifestation.tsx → use ImageField(imageUrl)
Step 6: Update add-library-ritual.tsx → use ImageField(imageUrl) + referenceImages
Step 7: Update remaining screens similarly
Step 8: Test image upload/preview/removal across all updated screens
```

### Part 2: Modal/Dialog Pattern Unification - COMPONENTS & INITIAL INTEGRATION ✅

**Completed Components:**
- ✅ ModalBase component - Unified modal wrapper with header, body, footer, multiple positions
- ✅ ConfirmationModal component - Simple yes/no confirmations with danger variant
- ✅ DatePickerModal component - Scrollable date selection with "Today" indicator
- ✅ SelectionModal component - Single/multi-select list items with optional icons and descriptions

**Modal Integration Completed:**
1. ✅ **add-ritual.tsx** - Library save prompt now uses ConfirmationModal (11 styles removed)
2. ✅ **log-ritual.tsx** - Date picker now uses DatePickerModal (16 styles removed)

**Modal Types Analysis:**
1. **useAlert hooks** in rituals.tsx, journal-entry/[id].tsx - Keep as-is (useAlert handles multiple button patterns)
2. **Reschedule Modal** (ritual/[id].tsx) - Complex (quick options + custom dates + footer button) - Would need specialized component
3. **Reference Images** modals - Simple array handling, keep current patterns
4. **CelebrationModal** - Specialized celebration animation, keep as-is

**Code Reduction This Session:**
- **Part 1 Image**: 12 style definitions removed (4 screens updated)
- **Part 2 Modal**: 27 style definitions removed (2 screens updated)
- **Total**: ~39 style definitions + 60+ lines of duplicate code consolidated

**Remaining Work (Lower Priority):**
- Create RescheduleModal if needed for ritual/[id].tsx workflow improvements
- Update remaining complex modals where SelectionModal might apply
- Profile.tsx preview modal (complex flow, lower priority)

---

**Implementation Plan:**
```
Step 1: Create ModalBase → unified modal wrapper with theme, animations
Step 2: Create DatePickerModal → extract from log-ritual.tsx, add-ritual.tsx
Step 3: Create ConfirmationModal → wrap useAlert with consistent styling
Step 4: Create SelectionModal → for library selection, category selection
Step 5: Update log-ritual.tsx → use DatePickerModal + ConfirmationModal
Step 6: Update add-ritual.tsx → use DatePickerModal + ConfirmationModal + SelectionModal
Step 7: Update rituals.tsx date picker → use DatePickerModal
Step 8: Update remaining screens with duplicate modals
Step 9: Test all modals for consistency, animation smoothness
```

**Tier 2 Deliverables - CURRENT STATUS:**
- ✅ ImageField component (wraps image upload + preview) - supports dynamic labels
- ✅ ModalBase component (unified modal wrapper with multiple positions)
- ✅ DatePickerModal component (centralized date selection with "Today" indicator)
- ✅ ConfirmationModal component (unified confirmations with danger variant)
- ✅ SelectionModal component (reusable single/multi-select list items)
- ✅ 6 screens updated with ImageField (add-ritual, log-ritual, add-manifestation, add-library-ritual featured image, write-journal, library-ritual featured image)
- ✅ 2 screens updated with modal components (add-ritual with ConfirmationModal, log-ritual with DatePickerModal)
- **Total code reduction so far**: ~39 style definitions removed, ~60 lines of duplicate modal code consolidated
- **Remaining**: Update remaining screens with SelectionModal, update CelebrationModal integration

---

---

## 📈 Tier 2 Completion Summary

**Status: ~70% Complete**
- Image consolidation: 6/8 screens updated (75%)
- Modal components created: 4 reusable components ✅
- Modal integration started: 2 screens updated (20%)
- Code reduction: ~39 style definitions removed, ~60+ lines of duplicate code consolidated

**What's Working Great:**
- ImageField component is flexible and reusable across multiple image patterns
- Modal components follow consistent patterns for easy integration
- New components significantly reduce code duplication
- Smooth TypeScript integration with minimal breaking changes

**When to Revisit Tier 2:**
- When adding new modal features, use ConfirmationModal/DatePickerModal instead of raw Modal
- If reschedule workflow needs improvement, create specialized RescheduleModal
- Profile.tsx can be updated when profile preview workflow is refactored

---

## 🏗️ Tier 3 - APPCONTEXT ARCHITECTURAL REFACTOR (Est. 2-3 hours)

### Current State

**AppContext.tsx**: 1,395 lines (all state in one file)
- User data (profile, preferences)
- Rituals data (CRUD, status management)
- Categories data (CRUD, colors)
- Deities data (CRUD, colors)
- Moods data (CRUD)
- Journal entries (CRUD, linking to rituals)
- Manifestations (CRUD)
- Seasonal data (snapshot management)
- Practice tracking (streak, stats)
- Library rituals (CRUD)

### Architecture Challenges
1. **Single Monolithic Context**: All state in one file makes changes risky
2. **Circular Dependencies**: Rituals depend on categories/deities, which update ritual styles
3. **Complex State Updates**: Ritual status changes trigger cascading updates
4. **Difficult to Test**: No clear boundaries between concerns
5. **Scaling Issues**: Adding new features requires modifying massive context file

### Proposed Architecture: Feature-Based Contexts

```
AppContext/
├── RitualsContext.tsx (350 lines)
│   └── Manages: rituals CRUD, status, scheduling
│   └── Exports: rituals, addRitual, updateRitual, deleteRitual, etc.
│
├── CategoriesContext.tsx (200 lines)
│   └── Manages: categories, categoryColors, validation
│   └── Exports: categories, addCategory, deleteCategory, etc.
│
├── DeitiesContext.tsx (200 lines)
│   └── Manages: deities, deityColors, validation
│   └── Exports: deities, addDeity, deleteDeity, etc.
│
├── MoodsContext.tsx (150 lines)
│   └── Manages: moods, mood operations
│   └── Exports: moods, addMood, deleteMood
│
├── JournalContext.tsx (250 lines)
│   └── Manages: journal entries, linking to rituals
│   └── Exports: journalEntries, addJournalEntry, updateEntry, etc.
│
├── ManifestationContext.tsx (150 lines)
│   └── Manages: manifestations, signs, tracking
│   └── Exports: manifestations, addManifestation, etc.
│
├── UserContext.tsx (100 lines)
│   └── Manages: profile, preferences, coreCategories
│   └── Exports: user, updateProfile, etc.
│
└── AppContextProvider.tsx (100 lines)
    └── Combines all sub-contexts
    └── Provides unified useApp() hook
```

### Refactoring Strategy

**Phase 1: Prepare (Low Risk)**
1. Create new context files (RitualsContext, CategoriesContext, etc.)
2. Copy relevant state/methods from AppContext to each new context
3. Create AppContextProvider that combines all contexts
4. Update useApp hook to work with new provider
5. Keep old AppContext as fallback for a sprint (for safety)

**Phase 2: Migrate (Medium Risk)**
1. Update one screen at a time to use new contexts
2. Test each screen thoroughly before moving to next
3. Migration order (by dependency chain):
   - Categories screen (simple CRUD)
   - Deities screen (simple CRUD)
   - Moods screen (simple CRUD)
   - Rituals screens (depends on categories/deities)
   - Journal screens (depends on rituals/moods)
   - Manifestations screens (depends on rituals/journal)

**Phase 3: Cleanup (Low Risk)**
1. Remove old AppContext.tsx
2. Remove AppContext providers from app layout
3. Update imports across entire codebase
4. Final testing across all screens

### Benefits of Tier 3

**Maintainability:**
- Change to categories only requires editing CategoriesContext
- Change to rituals only requires editing RitualsContext
- Clear separation of concerns

**Testability:**
- Each context can be tested in isolation
- Mock contexts for unit tests
- Clearer test organization

**Performance:**
- Components only subscribe to contexts they need
- Ritual changes don't re-render mood selectors
- Category changes don't re-render journal screens

**Scalability:**
- Adding new features = new context, not modifying AppContext
- Easier for new developers to understand state management
- Simpler git diffs for context changes

### Tier 3 Implementation Plan

```
Step 1: Create RitualsContext.tsx (copy rituals state from AppContext)
Step 2: Create CategoriesContext.tsx
Step 3: Create DeitiesContext.tsx
Step 4: Create MoodsContext.tsx
Step 5: Create JournalContext.tsx
Step 6: Create ManifestationContext.tsx
Step 7: Create UserContext.tsx
Step 8: Create AppContextProvider.tsx (combines all)
Step 9: Update app/_layout.tsx to use AppContextProvider
Step 10: Update useApp hook to work with new structure
Step 11: Test app boots correctly with new architecture
Step 12: Migrate manage-categories.tsx → use CategoriesContext
Step 13: Migrate manage-deities.tsx → use DeitiesContext
Step 14: Migrate remaining screens in dependency order
Step 15: Run full test suite
Step 16: Delete old AppContext.tsx
Step 17: Final verification
```

---

## 📊 Overall Refactoring Impact

### Before
- **Lines of Code**: ~1,395 in AppContext alone
- **Duplicate Code**: ~250+ lines (dateHelpers, modals, images)
- **Contexts**: 1 monolithic
- **Maintainability**: Low (ripple effects on changes)
- **Test Coverage**: Limited (hard to test in isolation)

### After (All 3 Tiers)
- **Lines of Code**: ~600 in AppContext (split across 7 contexts) + 400 new reusable components
- **Duplicate Code**: ~0 (consolidated)
- **Contexts**: 7 feature-focused
- **Maintainability**: High (clear boundaries)
- **Test Coverage**: High (easy to test in isolation)
- **Time Savings**: Future changes 50% faster due to clarity

### Time Estimate
- **Tier 1**: 2.5 hours ✅ DONE
- **Tier 2**: 1.5-2 hours (image + modal consolidation)
- **Tier 3**: 2-3 hours (context refactoring)
- **Total**: ~6-7.5 hours for complete refactoring

---

## Next Steps

1. **Tier 2 Start**: Begin with ImageField component
2. **Tier 2 Continue**: Create modal components (ModalBase, DatePickerModal, etc.)
3. **Tier 2 Complete**: Update 8+ screens to use new components
4. **Tier 3 Start**: Create feature-based contexts
5. **Tier 3 Complete**: Migrate all screens to new architecture
6. **Verification**: Run full test suite, test each screen end-to-end
7. **Documentation**: Update CLAUDE.md with new architecture
