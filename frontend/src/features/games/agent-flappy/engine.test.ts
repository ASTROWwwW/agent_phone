import { describe, expect, it } from 'vitest'

import {
  createAgentFlappyGame,
  FLAPPY_GAP_HEIGHT,
  FLAPPY_MAX_SPEED,
  FLAPPY_MAX_GAP_TOP,
  FLAPPY_MIN_GAP_HEIGHT,
  FLAPPY_MIN_GAP_TOP,
  flapAgentGlider,
  getAgentFlappyDifficulty,
  stepAgentFlappy,
} from './engine'

describe('agent flappy engine', () => {
  it('starts in a ready state', () => {
    expect(createAgentFlappyGame()).toMatchObject({ playerY: 48, score: 0, status: 'ready' })
  })

  it('starts and applies an upward impulse on flap', () => {
    const state = flapAgentGlider(createAgentFlappyGame())
    expect(state.status).toBe('playing')
    expect(state.playerVelocity).toBeLessThan(0)
  })

  it('applies deterministic time-based physics', () => {
    const state = flapAgentGlider(createAgentFlappyGame())
    expect(stepAgentFlappy(state, 0.1, () => 0.5)).toEqual(
      stepAgentFlappy(state, 0.1, () => 0.5),
    )
  })

  it('keeps generated gaps inside playable bounds', () => {
    const state = flapAgentGlider(createAgentFlappyGame())
    const low = stepAgentFlappy(state, 0.01, () => 0)
    const high = stepAgentFlappy(state, 0.01, () => 1)
    expect(low.obstacles[0].gapTop).toBe(FLAPPY_MIN_GAP_TOP)
    expect(high.obstacles[0].gapTop).toBe(FLAPPY_MAX_GAP_TOP)
    expect(high.obstacles[0].gapTop + FLAPPY_GAP_HEIGHT).toBeLessThan(100)
  })

  it('increases speed and narrows the gap as the score rises', () => {
    const start = getAgentFlappyDifficulty(0)
    const advanced = getAgentFlappyDifficulty(20)
    const maximum = getAgentFlappyDifficulty(100)

    expect(advanced.speed).toBeGreaterThan(start.speed)
    expect(advanced.gapHeight).toBeLessThan(start.gapHeight)
    expect(maximum.speed).toBe(FLAPPY_MAX_SPEED)
    expect(maximum.gapHeight).toBe(FLAPPY_MIN_GAP_HEIGHT)
  })

  it('scores an obstacle only once', () => {
    const state = {
      ...flapAgentGlider(createAgentFlappyGame()),
      obstacles: [{ gapHeight: FLAPPY_GAP_HEIGHT, gapTop: 30, id: 1, scored: false, x: 7 }],
    }
    const scored = stepAgentFlappy(state, 0.01, () => 0.5)
    expect(scored.score).toBe(1)
    expect(stepAgentFlappy(scored, 0.01, () => 0.5).score).toBe(1)
  })

  it('detects collision using the player edges', () => {
    const state = {
      ...flapAgentGlider(createAgentFlappyGame()),
      obstacles: [{ gapHeight: FLAPPY_GAP_HEIGHT, gapTop: 40, id: 1, scored: false, x: 22 }],
      playerY: 41,
      playerVelocity: 0,
    }
    expect(stepAgentFlappy(state, 0.01).status).toBe('over')
  })

  it('ends at the upper and lower boundaries', () => {
    const upper = { ...flapAgentGlider(createAgentFlappyGame()), playerY: 1 }
    const lower = { ...flapAgentGlider(createAgentFlappyGame()), playerY: 99 }
    expect(stepAgentFlappy(upper, 0.01).status).toBe('over')
    expect(stepAgentFlappy(lower, 0.01).status).toBe('over')
  })
})
