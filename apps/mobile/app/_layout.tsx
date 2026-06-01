import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'expo-notifications'
import { useAppStore } from '../src/stores/app.store'
import { useSettingsStore } from '../src/stores/settings.store'
import { useTimerStore } from '../src/stores/timer.store'
import { useUIStore } from '../src/stores/ui.store'
import '../global.css'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function RootLayout() {
  const loadAll = useAppStore((s) => s.loadAll)
  const loadSettings = useSettingsStore((s) => s.load)
  const loadFilters = useUIStore((s) => s.loadFilters)
  const init = useTimerStore((s) => s.init)

  useEffect(() => {
    void Promise.all([loadAll(), loadSettings(), loadFilters()])
    const cleanup = init()
    return cleanup
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/[id]"
          options={{ title: 'Task', headerBackTitle: 'Back' }}
        />
      </Stack>
    </GestureHandlerRootView>
  )
}
