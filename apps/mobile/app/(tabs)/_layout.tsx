import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { CheckSquare, BarChart2, Settings } from 'lucide-react-native'
import { PomodoroBar } from '../../src/components/layout/PomodoroBar'
import { useSettingsStore } from '../../src/stores/settings.store'

export default function TabLayout() {
  const primary = useSettingsStore((s) => s.primaryColor)

  return (
    <View style={{ flex: 1 }}>
      <PomodoroBar />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: primary,
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            borderTopColor: '#f1f5f9',
            borderTopWidth: 1,
          },
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '600', color: '#0f172a' },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color }) => <CheckSquare size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
          }}
        />
      </Tabs>
    </View>
  )
}
