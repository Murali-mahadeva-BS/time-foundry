import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTimerStore } from '../../stores/timer.store'
import { useSettingsStore } from '../../stores/settings.store'
import { formatCountdown } from '../../lib/time'
import { Play, Pause, Square, SkipForward } from 'lucide-react-native'

export function PomodoroBar() {
  const { state, remainingSeconds, pause, resume, stop, skip } = useTimerStore()
  const primary = useSettingsStore((s) => s.primaryColor)

  const isIdle = state.status === 'idle'
  const isRunning = state.status === 'running' || state.status === 'break'
  const isPaused = state.status === 'paused'
  const isBreak = state.status === 'break'

  if (isIdle) {
    return (
      <View style={[styles.bar, { backgroundColor: '#f8fafc', borderBottomColor: '#e2e8f0' }]}>
        <Text style={styles.idleText}>No timer running</Text>
      </View>
    )
  }

  return (
    <View style={[styles.bar, { backgroundColor: isBreak ? '#f0fdf4' : '#fff7ed', borderBottomColor: isBreak ? '#bbf7d0' : '#fed7aa' }]}>
      <View style={styles.left}>
        <Text style={[styles.countdown, { color: primary }]}>
          {formatCountdown(remainingSeconds)}
        </Text>
        <Text style={styles.label}>
          {isBreak ? 'Break' : isPaused ? 'Paused' : 'Focus'}
        </Text>
        <Text style={styles.sessions}>
          {state.sessionsCompleted} 🍅
        </Text>
      </View>

      <View style={styles.controls}>
        {isRunning && (
          <TouchableOpacity onPress={() => void pause()} style={styles.iconBtn}>
            <Pause size={20} color={primary} />
          </TouchableOpacity>
        )}
        {isPaused && (
          <TouchableOpacity onPress={() => void resume()} style={styles.iconBtn}>
            <Play size={20} color={primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => void skip()} style={styles.iconBtn}>
          <SkipForward size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void stop()} style={styles.iconBtn}>
          <Square size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countdown: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  sessions: {
    fontSize: 13,
    color: '#64748b',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
  },
  idleText: {
    fontSize: 13,
    color: '#94a3b8',
  },
})
