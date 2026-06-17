/**
 * Minimal `react-native` stub for component tests. Provides the API surface
 * Frontend components import (View, Text, etc.) as plain functions/objects
 * without pulling in the RN runtime. Tests assert behaviour via testIDs and
 * mock function calls rather than rendered output.
 *
 * If a component test needs richer RN semantics later, fall back to
 * `jest-expo` preset on a per-test basis and pin the test environment.
 */
import React from 'react';

const passthrough = (name: string) => {
  const C: any = (props: any) =>
    React.createElement(name, props, props?.children);
  C.displayName = name;
  return C;
};

const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (s: unknown) => s,
};

const Animated: any = {
  Value: class {
    setValue() {}
  },
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
  View: passthrough('Animated.View'),
  Text: passthrough('Animated.Text'),
};

export const View = passthrough('View');
export const Text = passthrough('Text');
export const TouchableOpacity = passthrough('TouchableOpacity');
export const TouchableWithoutFeedback = passthrough('TouchableWithoutFeedback');
export const Pressable = passthrough('Pressable');
export const ActivityIndicator = passthrough('ActivityIndicator');
export const Image = passthrough('Image');
export const ScrollView = passthrough('ScrollView');
export const TextInput = passthrough('TextInput');
export const Keyboard = { dismiss: jest.fn() };
export const InteractionManager = {
  runAfterInteractions: (cb: () => void) => cb(),
};
export const Alert = { alert: jest.fn() };
export { StyleSheet, Animated };

export default {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  Keyboard,
  InteractionManager,
  Alert,
  StyleSheet,
  Animated,
};
