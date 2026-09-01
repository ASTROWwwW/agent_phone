export type AgentFlappyStatus = 'over' | 'paused' | 'playing' | 'ready'
export type AgentFlappyDesign = 'dawn' | 'neon' | 'storm'

export type AgentFlappyObstacle = {
  gapHeight: number
  gapTop: number
  id: number
  scored: boolean
  x: number
}

export type AgentFlappyGameState = {
  nextObstacleId: number
  obstacles: AgentFlappyObstacle[]
  playerVelocity: number
  playerY: number
  score: number
  status: AgentFlappyStatus
}
