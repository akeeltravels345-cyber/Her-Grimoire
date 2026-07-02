import { Stack, useRouter } from 'expo-router';
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../contexts/AppContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useEffect } from 'react';

/** Redirects to onboarding on first launch, after data has loaded. */
function OnboardingGate() {
  const { isLoaded, isOnboarded } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && !isOnboarded) {
      router.replace('/onboarding');
    }
  }, [isLoaded, isOnboarded]);
  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AlertProvider>
        <SafeAreaProvider>
          <AppProvider>
            <ToastProvider>
              <OnboardingGate />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                <Stack.Screen name="ritual/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="add-ritual" options={{ presentation: 'modal' }} />
                <Stack.Screen name="log-ritual" options={{ presentation: 'card' }} />
                <Stack.Screen name="add-manifestation" options={{ presentation: 'modal' }} />
                <Stack.Screen name="manage-categories" options={{ presentation: 'modal' }} />
                <Stack.Screen name="manage-deities" options={{ presentation: 'modal' }} />
                <Stack.Screen name="profile" options={{ presentation: 'card' }} />
                <Stack.Screen name="add-library-ritual" options={{ presentation: 'modal' }} />
                <Stack.Screen name="add-to-practice" options={{ presentation: 'modal' }} />
                <Stack.Screen name="library-ritual/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="manifestation/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="journal-entry/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="write-journal" options={{ presentation: 'modal' }} />
                <Stack.Screen name="spell-research" options={{ presentation: 'card' }} />
                <Stack.Screen name="core-practice-settings" options={{ presentation: 'card' }} />
                <Stack.Screen name="monthly-intention" options={{ presentation: 'card' }} />
                <Stack.Screen name="month-review" options={{ presentation: 'card' }} />
                <Stack.Screen name="month-history" options={{ presentation: 'card' }} />
                <Stack.Screen name="privacy-policy" options={{ presentation: 'card' }} />
              </Stack>
            </ToastProvider>
          </AppProvider>
        </SafeAreaProvider>
      </AlertProvider>
    </ErrorBoundary>
  );
}
