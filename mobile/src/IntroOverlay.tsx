import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Image,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { SPLASH_BACKGROUND, WORD_COLOR } from "./config";

const logoSource = require("../assets/splash-icon.png");

type Props = {
  exiting: boolean;
  onHidden: () => void;
  onLayoutReady?: () => void;
};

export function IntroOverlay({ exiting, onHidden, onLayoutReady }: Props) {
  const { width, height } = useWindowDimensions();
  const logoSize = Math.round(Math.min(width * 0.46, height * 0.34, 200));
  const wordSize = Math.round(Math.min(Math.max(width * 0.046, 21.6), 27.2));
  const [reduceMotion, setReduceMotion] = useState(false);

  const enter = useSharedValue(reduceMotion ? 1 : 0);
  const idle = useSharedValue(0);
  const word = useSharedValue(reduceMotion ? 1 : 0);
  const shine = useSharedValue(0);
  const curtain = useSharedValue(1);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      enter.value = 1;
      word.value = 1;
      idle.value = 0;
      shine.value = 0;
      return;
    }
    enter.value = withTiming(1, {
      duration: 950,
      easing: Easing.bezier(0.16, 0.84, 0.28, 1),
    });
    word.value = withDelay(
      380,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
    idle.value = withDelay(
      950,
      withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    shine.value = withDelay(
      1050,
      withRepeat(
        withTiming(1, { duration: 3100, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      ),
    );
  }, [enter, idle, reduceMotion, shine, word]);

  useEffect(() => {
    if (!exiting) return;
    if (reduceMotion) {
      onHidden();
      return;
    }
    // Garantia: se o callback da animação não vier (Android), desmonta a
    // cortina assim mesmo para ela não ficar por cima do WebView.
    const safety = setTimeout(onHidden, 900);
    curtain.value = withTiming(
      0,
      { duration: 550, easing: Easing.out(Easing.ease) },
      (finished) => {
        if (finished) runOnJS(onHidden)();
      },
    );
    return () => clearTimeout(safety);
  }, [curtain, exiting, onHidden, reduceMotion]);

  const curtainStyle = useAnimatedStyle(() => ({
    opacity: curtain.value,
  }));

  const markStyle = useAnimatedStyle(() => {
    const enterRotate = interpolate(enter.value, [0, 1], [-200, 0]);
    const enterScale = interpolate(enter.value, [0, 1], [0.9, 1]);
    const enterOpacity = interpolate(enter.value, [0, 1], [0, 1]);
    const idleRotate = interpolate(idle.value, [0, 1], [0, 8]);
    const idleScale = interpolate(idle.value, [0, 1], [1, 1.03]);
    const spinningIn = enter.value < 0.999;
    return {
      opacity: enterOpacity,
      transform: [
        { rotate: `${spinningIn ? enterRotate : idleRotate}deg` },
        { scale: spinningIn ? enterScale : idleScale },
      ],
    };
  });

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: interpolate(word.value, [0, 1], [8, 0]) }],
  }));

  const shineStyle = useAnimatedStyle(() => {
    const band = logoSize * 0.38;
    const translateX = interpolate(
      shine.value,
      [0, 0.16, 0.58, 1],
      [-1.8 * band, -1.8 * band, 3.6 * band, 3.6 * band],
    );
    return {
      opacity: reduceMotion ? 0 : 1,
      transform: [{ translateX }, { skewX: "-18deg" }],
    };
  });

  return (
    <Animated.View
      style={[styles.curtain, curtainStyle]}
      pointerEvents={exiting ? "none" : "auto"}
      onLayout={onLayoutReady}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando Poliweb"
    >
      <View style={styles.stage}>
        <Animated.View style={[{ width: logoSize, height: logoSize }, markStyle]}>
          <Image
            source={logoSource}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shine,
              { width: logoSize * 0.38, height: logoSize * 1.24 },
              shineStyle,
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.95)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
        <Animated.Text
          style={[
            styles.word,
            wordStyle,
            {
              fontSize: wordSize,
              letterSpacing: wordSize * 0.06,
            },
          ]}
        >
          Poliweb
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curtain: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  stage: {
    alignItems: "center",
    gap: 18,
  },
  shine: {
    position: "absolute",
    top: "-12%",
    left: 0,
  },
  word: {
    fontWeight: "600",
    color: WORD_COLOR,
    fontFamily: Platform.select({
      web: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      default: undefined,
    }),
  },
});
