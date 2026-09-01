import { registerPhoneMediaElement } from '@/utils/phoneAudio'

import crashUrl from '@/assets/audio/agent-flappy/crash.wav?url'
import flapUrl from '@/assets/audio/agent-flappy/flap.wav?url'
import pointUrl from '@/assets/audio/agent-flappy/point.wav?url'

export type AgentFlappySound = 'crash' | 'flap' | 'point'
const urls: Record<AgentFlappySound, string> = { crash: crashUrl, flap: flapUrl, point: pointUrl }
const pools = new Map<AgentFlappySound, HTMLAudioElement[]>()

export function playAgentFlappySound(sound: AgentFlappySound, enabled: boolean): void {
  if (!enabled) return
  let players = pools.get(sound)
  if (!players) {
    players = Array.from({ length: 3 }, () => {
      const player = registerPhoneMediaElement(new Audio(urls[sound]))
      player.preload = 'auto'
      player.volume = 0.84
      return player
    })
    pools.set(sound, players)
  }
  const player = players.find((candidate) => candidate.paused) ?? players[0]
  player.currentTime = 0
  void player.play().catch((error: unknown) => console.error(`[Agent Flappy audio] Failed to play ${sound}`, error))
}
