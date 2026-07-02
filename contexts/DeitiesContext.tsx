import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deity, DEFAULT_DEITIES, DEFAULT_DEITY_COLORS } from '../constants/config';

interface DeitiesContextType {
  deities: Deity[];
  deityColors: Record<string, string>;
  addDeity: (deity: Deity, color: string) => void;
  deleteDeity: (deityId: string) => void;
  updateDeityColor: (deityId: string, color: string) => void;
}

const DeitiesContext = createContext<DeitiesContextType | undefined>(undefined);

export const DeitiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deities, setDeities] = useState<Deity[]>(DEFAULT_DEITIES);
  const [deityColors, setDeityColors] = useState<Record<string, string>>(DEFAULT_DEITY_COLORS);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await AsyncStorage.getItem('grimoire_deities');
        const colors = await AsyncStorage.getItem('grimoire_deity_colors');
        if (d) setDeities(JSON.parse(d));
        if (colors) setDeityColors(JSON.parse(colors));
      } catch (error) {
        console.error('Error loading deities:', error);
      }
    };
    load();
  }, []);

  const addDeity = (deity: Deity, color: string) => {
    const updated = [...deities, deity];
    setDeities(updated);
    setDeityColors({ ...deityColors, [deity.id]: color });
    AsyncStorage.setItem('grimoire_deities', JSON.stringify(updated));
    AsyncStorage.setItem('grimoire_deity_colors', JSON.stringify({ ...deityColors, [deity.id]: color }));
  };

  const deleteDeity = (deityId: string) => {
    const updated = deities.filter(d => d.id !== deityId);
    setDeities(updated);
    const colors = { ...deityColors };
    delete colors[deityId];
    setDeityColors(colors);
    AsyncStorage.setItem('grimoire_deities', JSON.stringify(updated));
    AsyncStorage.setItem('grimoire_deity_colors', JSON.stringify(colors));
  };

  const updateDeityColor = (deityId: string, color: string) => {
    setDeityColors({ ...deityColors, [deityId]: color });
    AsyncStorage.setItem('grimoire_deity_colors', JSON.stringify({ ...deityColors, [deityId]: color }));
  };

  return (
    <DeitiesContext.Provider value={{ deities, deityColors, addDeity, deleteDeity, updateDeityColor }}>
      {children}
    </DeitiesContext.Provider>
  );
};

export const useDeities = () => {
  const context = useContext(DeitiesContext);
  if (!context) throw new Error('useDeities must be used within DeitiesProvider');
  return context;
};
