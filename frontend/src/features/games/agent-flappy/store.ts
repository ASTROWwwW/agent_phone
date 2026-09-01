import { defineStore } from 'pinia'

import { useGamesStore } from '@/features/games/store'

import {
  createAgentFlappyGame,
  flapAgentGlider,
  pauseAgentFlappy,
  resumeAgentFlappy,
  stepAgentFlappy,
} from './engine'
import type { AgentFlappyDesign, AgentFlappyGameState } from './types'

type AgentFlappySave = {
  design: AgentFlappyDesign
  highScore: number
  soundEnabled: boolean
}

function isDesign(value: unknown): value is AgentFlappyDesign {
  return value === 'dawn' || value === 'neon' || value === 'storm'
}

export const useAgentFlappyStore = defineStore('agent-flappy', {
  state: () => ({
    design: 'dawn' as AgentFlappyDesign,
    game: null as AgentFlappyGameState | null,
    highScore: 0,
    hydrated: false,
    menuOpen: true,
    soundEnabled: true,
  }),
  actions: {
    hydrate(): void {
      if (this.hydrated) return
      const saved = useGamesStore().readGame<Partial<AgentFlappySave>>('agent-flappy')
      this.highScore = typeof saved?.highScore === 'number' && saved.highScore >= 0 ? Math.floor(saved.highScore) : 0
      this.design = isDesign(saved?.design) ? saved.design : 'dawn'
      if (typeof saved?.soundEnabled === 'boolean') this.soundEnabled = saved.soundEnabled
      this.hydrated = true
    },
    persist(): void {
      useGamesStore().saveGame('agent-flappy', {
        design: this.design,
        highScore: this.highScore,
        soundEnabled: this.soundEnabled,
      } satisfies AgentFlappySave)
    },
    start(): void {
      this.game = createAgentFlappyGame()
      this.menuOpen = false
    },
    flap(): void {
      if (this.game) this.game = flapAgentGlider(this.game)
    },
    tick(elapsedSeconds: number): void {
      if (!this.game) return
      this.game = stepAgentFlappy(this.game, elapsedSeconds)
      if (this.game.status === 'over' && this.game.score > this.highScore) {
        this.highScore = this.game.score
        this.persist()
      }
    },
    pause(): void {
      if (this.game) this.game = pauseAgentFlappy(this.game)
    },
    resume(): void {
      if (this.game) {
        this.game = resumeAgentFlappy(this.game)
        this.menuOpen = false
      }
    },
    showMenu(): void {
      this.pause()
      this.menuOpen = true
    },
    setDesign(design: AgentFlappyDesign): void {
      this.design = design
      this.persist()
    },
    setSoundEnabled(enabled: boolean): void {
      this.soundEnabled = enabled
      this.persist()
    },
  },
})
