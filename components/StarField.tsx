import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StarData {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  baseOpacity: number;
  delay: number;
  duration: number;
}

function AnimatedStar({ star }: { star: StarData }) {
  const opacity = useRef(new Animated.Value(star.baseOpacity * 0.2)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: star.baseOpacity, duration: star.duration, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: star.baseOpacity * 0.2, duration: star.duration, useNativeDriver: true }),
        ])
      ).start();
    }, star.delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${star.x}%` as any,
        top: `${star.y}%` as any,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: star.color,
        opacity,
      }}
    />
  );
}

function ShootingStar() {
  const { width: screenW, height: screenH } = Dimensions.get('window');
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const trailScale = useRef(new Animated.Value(0.3)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    const startX = Math.random() * (screenW * 0.6) + screenW * 0.05;
    const startY = Math.random() * (screenH * 0.45) + 20;
    const travel = 120 + Math.random() * 80;

    translateX.setValue(startX);
    translateY.setValue(startY);
    trailScale.setValue(0.3);
    opacity.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.75, duration: 380, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(trailScale, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(trailScale, { toValue: 0.5, duration: 480, useNativeDriver: true }),
      ]),
      Animated.timing(translateX, { toValue: startX + travel, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: startY + travel * 0.55, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [screenW, screenH]);

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 4000;
      timeoutRef.current = setTimeout(() => {
        trigger();
        scheduleNext();
      }, delay);
    };
    timeoutRef.current = setTimeout(() => {
      trigger();
      scheduleNext();
    }, 3000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [trigger]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 64,
        height: 2,
        zIndex: 2,
        opacity,
        transform: [
          { translateX },
          { translateY },
          { rotate: '30deg' },
          { scaleX: trailScale },
        ],
      }}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', 'rgba(245,213,224,0.3)', '#F5D5E0', '#FFFFFF']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: 64, height: 2, borderRadius: 1 }}
      />
      <View style={{
        position: 'absolute', right: -1, top: -1.5,
        width: 5, height: 5, borderRadius: 2.5,
        backgroundColor: '#FFFFFF',
        shadowColor: '#F5D5E0', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9, shadowRadius: 6, elevation: 4,
      }} />
    </Animated.View>
  );
}

interface StarFieldProps {
  starCount?: number;
  showShootingStar?: boolean;
}

export default function StarField({ starCount = 80, showShootingStar = true }: StarFieldProps) {
  const stars = useMemo(() => {
    const result: StarData[] = [];
    const brightCount = Math.round(starCount * 0.15);
    const mediumCount = Math.round(starCount * 0.30);
    for (let i = 0; i < starCount; i++) {
      let size: number, baseOpacity: number, color: string;
      if (i < brightCount) {
        size = 2.5 + Math.random() * 0.5;
        baseOpacity = 0.8 + Math.random() * 0.2;
        color = Math.random() < 0.2 ? '#F5D5E0' : '#FFFFFF';
      } else if (i < brightCount + mediumCount) {
        size = 1.5;
        baseOpacity = 0.5 + Math.random() * 0.2;
        color = '#FFFFFF';
      } else {
        size = 0.8 + Math.random() * 0.2;
        baseOpacity = 0.2 + Math.random() * 0.2;
        color = '#FFFFFF';
      }
      result.push({
        id: i,
        x: Math.random() * 96 + 2,
        y: Math.random() * 96 + 2,
        size,
        color,
        baseOpacity,
        delay: Math.random() * 4000,
        duration: 2000 + Math.random() * 3000,
      });
    }
    return result;
  }, [starCount]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} pointerEvents="none">
      {stars.map(star => (
        <AnimatedStar key={star.id} star={star} />
      ))}
      {showShootingStar ? <ShootingStar /> : null}
    </View>
  );
}
