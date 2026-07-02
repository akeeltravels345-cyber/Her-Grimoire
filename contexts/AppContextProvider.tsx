import React, { ReactNode } from 'react';
import { RitualsProvider, useRituals } from './RitualsContext';
import { CategoriesProvider, useCategories } from './CategoriesContext';
import { DeitiesProvider, useDeities } from './DeitiesContext';

/**
 * Unified AppContextProvider that composes all feature-based contexts
 * Provides backward compatibility through useApp() hook
 */
export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RitualsProvider>
      <CategoriesProvider>
        <DeitiesProvider>
          {children}
        </DeitiesProvider>
      </CategoriesProvider>
    </RitualsProvider>
  );
};

/**
 * Unified hook for accessing all app state
 * Maintains backward compatibility with existing screens
 */
export const useApp = () => {
  const rituals = useRituals();
  const categories = useCategories();
  const deities = useDeities();

  return {
    // Rituals
    rituals: rituals.rituals,
    isLoaded: rituals.isLoaded,
    addRitual: rituals.addRitual,
    updateRitual: rituals.updateRitual,
    deleteRitual: rituals.deleteRitual,
    deleteFutureInSeries: rituals.deleteFutureInSeries,
    deleteEntireSeries: rituals.deleteEntireSeries,
    stopSchedule: rituals.stopSchedule,

    // Categories
    categories: categories.categories,
    categoryColors: categories.categoryColors,
    addCategory: categories.addCategory,
    deleteCategory: categories.deleteCategory,

    // Deities
    deities: deities.deities,
    deityColors: deities.deityColors,
    addDeity: deities.addDeity,
    deleteDeity: deities.deleteDeity,

    // Placeholder for remaining methods (from old AppContext)
    // These will be added as additional contexts are created
    addJournalEntry: () => {},
    updateJournalEntry: () => {},
    deleteJournalEntry: () => {},
    updateStandaloneEntry: () => {},
    addManifestationResult: () => {},
    deleteManifestationResult: () => {},
    deleteManifestationRecord: () => {},
    updateManifestation: () => {},
    unspillManifestation: () => {},
    undoLastManifestationAction: () => {},
    getManifestations: () => [],
    libraryRituals: [],
    manifestations: [],
    standaloneEntries: [],
    addLibraryRitual: () => '',
    updateLibraryRitual: () => {},
    deleteLibraryRitual: () => {},
    updateMonthlyIntention: () => {},
    getMonthlyIntention: () => null,
    getCurrentMonthSnapshot: () => null,
    getMoodsList: () => [],
    addMood: () => {},
    deleteMood: () => {},
    getJournalTypes: () => [],
  };
};
