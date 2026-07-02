import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PracticeCategory, DEFAULT_CATEGORIES, DEFAULT_CATEGORY_COLORS } from '../constants/config';

interface CategoriesContextType {
  categories: PracticeCategory[];
  categoryColors: Record<string, string>;
  addCategory: (category: PracticeCategory, color: string) => void;
  deleteCategory: (categoryId: string) => void;
  updateCategoryColor: (categoryId: string, color: string) => void;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<PracticeCategory[]>(DEFAULT_CATEGORIES);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(DEFAULT_CATEGORY_COLORS);

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await AsyncStorage.getItem('grimoire_categories');
        const colors = await AsyncStorage.getItem('grimoire_category_colors');
        if (cats) setCategories(JSON.parse(cats));
        if (colors) setCategoryColors(JSON.parse(colors));
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    load();
  }, []);

  const addCategory = (category: PracticeCategory, color: string) => {
    const updated = [...categories, category];
    setCategories(updated);
    setCategoryColors({ ...categoryColors, [category.id]: color });
    AsyncStorage.setItem('grimoire_categories', JSON.stringify(updated));
    AsyncStorage.setItem('grimoire_category_colors', JSON.stringify({ ...categoryColors, [category.id]: color }));
  };

  const deleteCategory = (categoryId: string) => {
    const updated = categories.filter(c => c.id !== categoryId);
    setCategories(updated);
    const colors = { ...categoryColors };
    delete colors[categoryId];
    setCategoryColors(colors);
    AsyncStorage.setItem('grimoire_categories', JSON.stringify(updated));
    AsyncStorage.setItem('grimoire_category_colors', JSON.stringify(colors));
  };

  const updateCategoryColor = (categoryId: string, color: string) => {
    setCategoryColors({ ...categoryColors, [categoryId]: color });
    AsyncStorage.setItem('grimoire_category_colors', JSON.stringify({ ...categoryColors, [categoryId]: color }));
  };

  return (
    <CategoriesContext.Provider value={{ categories, categoryColors, addCategory, deleteCategory, updateCategoryColor }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) throw new Error('useCategories must be used within CategoriesProvider');
  return context;
};
