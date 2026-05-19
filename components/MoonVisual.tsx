import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface MoonVisualProps {
  phaseIndex: number;
  size: number;
}

export default function MoonVisual({ phaseIndex, size }: MoonVisualProps) {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });
  const glowAnimStyle = { transform: [{ scale: glowScale }], opacity: glowOpacity };

  const isNewMoon = phaseIndex === 0;
  const isFullMoon = phaseIndex === 4;

  const glowSize = size * 1.4;

  const moonSurfaceColor = isNewMoon ? '#3A3245' : '#F0E6D0';

  const glowColor = isNewMoon
    ? 'rgba(160,150,180,0.08)'
    : isFullMoon
      ? 'rgba(245,230,200,0.35)'
      : 'rgba(230,220,190,0.2)';

  const getShadowStyle = () => {
    if (isFullMoon) return null;
    if (isNewMoon) return { width: size, left: 0 };

    const halfSize = size / 2;

    switch (phaseIndex) {
      case 1: return { width: size * 0.75, left: 0 };
      case 2: return { width: halfSize, left: 0 };
      case 3: return { width: size * 0.3, left: 0 };
      case 5: return { width: size * 0.3, right: 0 };
      case 6: return { width: halfSize, right: 0 };
      case 7: return { width: size * 0.75, right: 0 };
      default: return null;
    }
  };

  const shadowStyle = getShadowStyle();

  const getTerminatorBorderRadius = () => {
    switch (phaseIndex) {
      case 1: return { borderTopRightRadius: size * 0.6, borderBottomRightRadius: size * 0.6 };
      case 3: return { borderTopRightRadius: size * 0.3, borderBottomRightRadius: size * 0.3 };
      case 5: return { borderTopLeftRadius: size * 0.3, borderBottomLeftRadius: size * 0.3 };
      case 7: return { borderTopLeftRadius: size * 0.6, borderBottomLeftRadius: size * 0.6 };
      default: return {};
    }
  };

  const terminatorRadius = getTerminatorBorderRadius();

  return (
    <View style={{ width: glowSize, height: glowSize, alignItems: 'center', justifyContent: 'center' }}>
      {/* Animated atmospheric glow */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: glowColor,
          },
          glowAnimStyle,
        ]}
      />

      {/* Glow ring */}
      {!isNewMoon ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size * 1.15,
              height: size * 1.15,
              borderRadius: size * 0.575,
              borderWidth: 1,
              borderColor: isFullMoon ? 'rgba(255,248,230,0.12)' : 'rgba(230,220,200,0.08)',
            },
            glowAnimStyle,
          ]}
        />
      ) : null}

      {/* Moon disc */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: moonSurfaceColor,
          overflow: 'hidden',
          shadowColor: isNewMoon ? '#8880AA' : '#FFF5E0',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isNewMoon ? 0.15 : 0.3,
          shadowRadius: size * 0.15,
          elevation: isNewMoon ? 1 : 3,
        }}
      >
        {!isNewMoon ? (
          <View
            style={{
              position: 'absolute',
              top: size * 0.1,
              left: size * 0.1,
              width: size * 0.55,
              height: size * 0.55,
              borderRadius: size * 0.275,
              backgroundColor: 'rgba(255,255,248,0.15)',
            }}
          />
        ) : null}

        {!isNewMoon ? (
          <>
            <View style={{ position: 'absolute', top: size * 0.2, left: size * 0.25, width: size * 0.3, height: size * 0.22, borderRadius: size * 0.12, backgroundColor: 'rgba(120,110,95,0.18)' }} />
            <View style={{ position: 'absolute', top: size * 0.45, left: size * 0.4, width: size * 0.25, height: size * 0.18, borderRadius: size * 0.1, backgroundColor: 'rgba(120,110,95,0.14)' }} />
            <View style={{ position: 'absolute', top: size * 0.15, left: size * 0.55, width: size * 0.18, height: size * 0.14, borderRadius: size * 0.08, backgroundColor: 'rgba(120,110,95,0.12)' }} />
            <View style={{ position: 'absolute', top: size * 0.6, left: size * 0.2, width: size * 0.08, height: size * 0.08, borderRadius: size * 0.04, backgroundColor: 'rgba(140,130,115,0.15)' }} />
            <View style={{ position: 'absolute', top: size * 0.35, left: size * 0.65, width: size * 0.06, height: size * 0.06, borderRadius: size * 0.03, backgroundColor: 'rgba(140,130,115,0.12)' }} />
          </>
        ) : null}

        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: size / 2,
            borderWidth: size * 0.06,
            borderColor: isNewMoon ? 'rgba(15,10,25,0.4)' : 'rgba(100,85,70,0.12)',
          }}
        />

        {shadowStyle && !isNewMoon ? (
          <View
            style={{
              position: 'absolute', top: 0, bottom: 0,
              backgroundColor: 'rgba(8,5,18,0.92)',
              ...shadowStyle,
              ...terminatorRadius,
            }}
          />
        ) : null}

        {isNewMoon ? (
          <View
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: 'rgba(200,190,210,0.2)',
            }}
          />
        ) : null}
      </View>
    </View>
  );
}
