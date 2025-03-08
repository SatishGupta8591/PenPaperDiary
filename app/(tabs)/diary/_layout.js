import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="pin-setup" />
      <Stack.Screen name="add_diary" />
      <Stack.Screen name="archive" />
    </Stack>
  );
}