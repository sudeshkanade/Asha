/**
 * SafeAreaProvider shim for web.
 * On the web, safe area insets are not needed, so this is a simple passthrough.
 */
import React from 'react';
import { View } from 'react-native';

export const SafeAreaProvider = ({ children }) => {
  return <View style={{ flex: 1 }}>{children}</View>;
};

export const SafeAreaView = ({ children, style, ...props }) => {
  return <View style={[{ flex: 1 }, style]} {...props}>{children}</View>;
};

export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });

export default { SafeAreaProvider, SafeAreaView, useSafeAreaInsets };
