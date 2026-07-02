import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Ritual } from '../services/mockData';

interface RitualsContextType {
  rituals: Ritual[];
  isLoaded: boolean;
  addRitual: (ritual: Omit<Ritual, 'id' | 'createdAt' | 'timesPerformed' | 'journal'> & { status?: Ritual['status'] }) => void;
  updateRitual: (id: string, updates: Partial<Ritual>) => void;
  deleteRitual: (id: string, deleteHistory?: boolean) => void;
  deleteFutureInSeries: (seriesId: string, fromDate: string) => void;
  deleteEntireSeries: (seriesId: string) => void;
  stopSchedule: (seriesId: string) => void;
}

const RitualsContext = createContext<RitualsContextType | undefined>(undefined);

export const RitualsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load rituals from AsyncStorage
    const loadRituals = async () => {
      try {
        const stored = await AsyncStorage.getItem('grimoire_rituals');
        if (stored) setRituals(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading rituals:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadRituals();
  }, []);

  const addRitual = (ritual: Omit<Ritual, 'id' | 'createdAt' | 'timesPerformed' | 'journal'> & { status?: Ritual['status'] }) => {
    const newRitual: Ritual = {
      ...ritual,
      id: `ritual_${Date.now()}`,
      createdAt: new Date().toISOString(),
      timesPerformed: 0,
      journal: [],
      status: ritual.status || 'scheduled',
    } as Ritual;

    const updated = [...rituals, newRitual];
    setRituals(updated);
    AsyncStorage.setItem('grimoire_rituals', JSON.stringify(updated));
  };

  const updateRitual = (id: string, updates: Partial<Ritual>) => {
    const updated = rituals.map(r => r.id === id ? { ...r, ...updates } : r);
    setRituals(updated);
    AsyncStorage.setItem('grimoire_rituals', JSON.stringify(updated));
  };

  const deleteRitual = (id: string, deleteHistory?: boolean) => {
    const updated = rituals.filter(r => r.id !== id);
    setRituals(updated);
    AsyncStorage.setItem('grimoire_rituals', JSON.stringify(updated));
  };

  const deleteFutureInSeries = (seriesId: string, fromDate: string) => {
    const updated = rituals.map(r =>
      r.id === seriesId || (r.seriesParentId === seriesId && new Date(r.scheduledDate).getTime() >= new Date(fromDate).getTime())
        ? { ...r, status: 'stopped' as const }
        : r
    );
    setRituals(updated);
    AsyncStorage.setItem('grimoire_rituals', JSON.stringify(updated));
  };

  const deleteEntireSeries = (seriesId: string) => {
    const updated = rituals.filter(r => r.id !== seriesId && r.seriesParentId !== seriesId);
    setRituals(updated);
    AsyncStorage.setItem('grimoire_rituals', JSON.stringify(updated));
  };

  const stopSchedule = (seriesId: string) => {
    const updated = rituals.map(r =>
      r.id === seriesId ? { ...r, status: 'stopped' as const } : r
    );
    setRituals(updated);
    AsyncStorage.setItem('grimoire_rituals', JSON.stringify(updated));
  };

  return (
    <RitualsContext.Provider value={{ rituals, isLoaded, addRitual, updateRitual, deleteRitual, deleteFutureInSeries, deleteEntireSeries, stopSchedule }}>
      {children}
    </RitualsContext.Provider>
  );
};

export const useRituals = () => {
  const context = useContext(RitualsContext);
  if (!context) throw new Error('useRituals must be used within RitualsProvider');
  return context;
};
