<script setup lang="ts">
import { ChevronLeft, Pause, Play, Trophy } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  SNAKE_BOARD_HEIGHT,
  SNAKE_BOARD_WIDTH,
} from '@/features/games/snake/engine'
import { useSnakeStore } from '@/features/games/snake/store'
import type {
  SnakeDirection,
  SnakePoint,
  SnakeSpeed,
} from '@/features/games/snake/types'
import { usePhoneStore } from '@/stores/phone'
import { SkyButton } from '@/ui'

const phone = usePhoneStore()
const snake = useSnakeStore()
const speedOptions: SnakeSpeed[] = ['relaxed', 'normal', 'fast']
const game = computed(() => snake.game)
const board = ref<HTMLCanvasElement | null>(null)

/*
 * Le plateau etait un empilement de <span> absolus dont chaque segment animait
 * left/top/width/height. Chaque image declenchait donc une passe de layout par
 * segment, et le jeu s'effondrait des que le serpent s'allongeait. Tout passe
 * maintenant par une seule surface canvas : une boucle requestAnimationFrame
 * avance la logique a pas fixe et interpole l'affichage entre deux pas, ce qui
 * donne un deplacement continu quelle que soit la vitesse choisie.
 */
const PALETTE = {
  body: '#3FE07A',
  bodyDeep: '#0E9B45',
  fruit: '#FF5C50',
  fruitStem: '#8ADB67',
  grid: 'rgba(173, 233, 160, 0.055)',
  head: '#8CF0A8',
  ink: '#0B2417',
} as const

let context: CanvasRenderingContext2D | null = null
let frameHandle = 0
let lastFrameAt = 0
let tickAccumulator = 0
let previousBody: SnakePoint[] = []
let boardWidth = 0
let boardHeight = 0
let boardObserver: ResizeObserver | undefined
let swipeOrigin: { x: number; y: number } | null = null
let bodyGradient: CanvasGradient | null = null
let bodyGradientHeight = 0

function resizeBoard(): void {
  const canvas = board.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  // Le CEF embarque tourne souvent en ratio > 1 : plafonner a 2 garde le
  // remplissage raisonnable sans que le trait paraisse cranele.
  const ratio = Math.min(2, window.devicePixelRatio || 1)
  boardWidth = rect.width
  boardHeight = rect.height
  canvas.width = Math.round(rect.width * ratio)
  canvas.height = Math.round(rect.height * ratio)
  bodyGradient = null
  context = canvas.getContext('2d')
  context?.setTransform(ratio, 0, 0, ratio, 0, 0)
}

function drawGrid(cell: number, originX: number, originY: number): void {
  const ctx = context
  if (!ctx) return

  ctx.strokeStyle = PALETTE.grid
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let column = 1; column < SNAKE_BOARD_WIDTH; column += 1) {
    const x = Math.round(originX + column * cell) + 0.5
    ctx.moveTo(x, originY)
    ctx.lineTo(x, originY + SNAKE_BOARD_HEIGHT * cell)
  }
  for (let row = 1; row < SNAKE_BOARD_HEIGHT; row += 1) {
    const y = Math.round(originY + row * cell) + 0.5
    ctx.moveTo(originX, y)
    ctx.lineTo(originX + SNAKE_BOARD_WIDTH * cell, y)
  }
  ctx.stroke()
}

function drawFruit(
  fruit: SnakePoint,
  cell: number,
  originX: number,
  originY: number,
  now: number,
): void {
  const ctx = context
  if (!ctx) return

  const x = originX + (fruit.x + 0.5) * cell
  const y = originY + (fruit.y + 0.5) * cell
  const radius = cell * 0.3 * (1 + Math.sin(now / 260) * 0.08)

  ctx.fillStyle = PALETTE.fruit
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = PALETTE.fruitStem
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(1.5, cell * 0.09)
  ctx.beginPath()
  ctx.moveTo(x, y - radius * 0.85)
  ctx.lineTo(x + radius * 0.5, y - radius * 1.6)
  ctx.stroke()
}

function drawSnake(
  points: SnakePoint[],
  cell: number,
  direction: SnakeDirection,
): void {
  const ctx = context
  if (!ctx || points.length === 0) return

  if (!bodyGradient || bodyGradientHeight !== boardHeight) {
    bodyGradient = ctx.createLinearGradient(0, 0, 0, boardHeight)
    bodyGradient.addColorStop(0, PALETTE.body)
    bodyGradient.addColorStop(1, PALETTE.bodyDeep)
    bodyGradientHeight = boardHeight
  }

  ctx.strokeStyle = bodyGradient
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = cell * 0.74
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y)
  }
  ctx.stroke()

  // Tete : une pastille un peu plus claire et plus large, avec deux yeux
  // decales perpendiculairement au sens de deplacement.
  const head = points[0]
  ctx.fillStyle = PALETTE.head
  ctx.beginPath()
  ctx.arc(head.x, head.y, cell * 0.42, 0, Math.PI * 2)
  ctx.fill()

  const forward =
    direction === 'left'
      ? { x: -1, y: 0 }
      : direction === 'right'
        ? { x: 1, y: 0 }
        : direction === 'up'
          ? { x: 0, y: -1 }
          : { x: 0, y: 1 }
  const side = { x: -forward.y, y: forward.x }
  const eyeRadius = Math.max(1.4, cell * 0.09)
  ctx.fillStyle = PALETTE.ink
  for (const offset of [1, -1]) {
    ctx.beginPath()
    ctx.arc(
      head.x + forward.x * cell * 0.14 + side.x * offset * cell * 0.17,
      head.y + forward.y * cell * 0.14 + side.y * offset * cell * 0.17,
      eyeRadius,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
}

function renderBoard(alpha: number, now: number): void {
  const ctx = context
  const state = snake.game
  if (!ctx || !state || boardWidth === 0) return

  const cell = Math.min(
    boardWidth / SNAKE_BOARD_WIDTH,
    boardHeight / SNAKE_BOARD_HEIGHT,
  )
  const originX = (boardWidth - cell * SNAKE_BOARD_WIDTH) / 2
  const originY = (boardHeight - cell * SNAKE_BOARD_HEIGHT) / 2

  ctx.clearRect(0, 0, boardWidth, boardHeight)
  drawGrid(cell, originX, originY)
  drawFruit(state.fruit, cell, originX, originY, now)

  // Apres un pas, body[i] vaut previousBody[i - 1] : chaque anneau glisse vers
  // la place de celui qui le precede, ce qui suffit a animer tout le corps.
  const points = state.body.map((segment, index) => {
    const previous =
      previousBody[index] ??
      previousBody[previousBody.length - 1] ??
      segment
    return {
      x: originX + (previous.x + (segment.x - previous.x) * alpha + 0.5) * cell,
      y: originY + (previous.y + (segment.y - previous.y) * alpha + 0.5) * cell,
    }
  })
  drawSnake(points, cell, state.direction)
}

function loop(timestamp: number): void {
  frameHandle = window.requestAnimationFrame(loop)
  const state = snake.game
  if (!state) return

  // Un onglet revenu au premier plan peut rendre delta enorme : le plafond
  // evite que le serpent traverse le plateau d'un coup.
  const delta = lastFrameAt === 0 ? 0 : Math.min(240, timestamp - lastFrameAt)
  lastFrameAt = timestamp

  if (state.status === 'playing') {
    tickAccumulator += delta
    while (tickAccumulator >= snake.tickMilliseconds) {
      tickAccumulator -= snake.tickMilliseconds
      previousBody = snake.game?.body ?? []
      snake.tick()
      if (snake.game?.status !== 'playing') {
        tickAccumulator = 0
        break
      }
    }
  } else {
    tickAccumulator = 0
  }

  const alpha =
    snake.game?.status === 'playing'
      ? Math.min(1, tickAccumulator / snake.tickMilliseconds)
      : 1
  renderBoard(alpha, timestamp)
}

function startLoop(): void {
  if (frameHandle !== 0) return
  lastFrameAt = 0
  tickAccumulator = 0
  frameHandle = window.requestAnimationFrame(loop)
}

function stopLoop(): void {
  if (frameHandle === 0) return
  window.cancelAnimationFrame(frameHandle)
  frameHandle = 0
}

function returnToMenu(): void {
  snake.showMenu()
}

function startGame(): void {
  previousBody = []
  tickAccumulator = 0
  lastFrameAt = 0
  snake.start()
  previousBody = snake.game?.body ?? []
}

function turn(direction: SnakeDirection): void {
  snake.turn(direction)
}

function onBoardPointerDown(event: PointerEvent): void {
  swipeOrigin = { x: event.clientX, y: event.clientY }
}

function onBoardPointerMove(event: PointerEvent): void {
  if (!swipeOrigin) return

  const distanceX = event.clientX - swipeOrigin.x
  const distanceY = event.clientY - swipeOrigin.y
  const threshold = 14
  if (Math.abs(distanceX) < threshold && Math.abs(distanceY) < threshold) return

  turn(
    Math.abs(distanceX) > Math.abs(distanceY)
      ? distanceX > 0
        ? 'right'
        : 'left'
      : distanceY > 0
        ? 'down'
        : 'up',
  )
  // On repart de la position courante : un long balayage peut ainsi enchainer
  // plusieurs virages sans relever le doigt.
  swipeOrigin = { x: event.clientX, y: event.clientY }
}

function onBoardPointerUp(): void {
  swipeOrigin = null
}

function handleKeydown(event: KeyboardEvent): void {
  const directionByKey: Partial<Record<string, SnakeDirection>> = {
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    a: 'left',
    d: 'right',
    s: 'down',
    w: 'up',
  }
  const direction = directionByKey[event.key.toLowerCase()] ?? directionByKey[event.key]

  if (direction) {
    event.preventDefault()
    turn(direction)
    return
  }

  if (event.key === ' ' && snake.game) {
    event.preventDefault()
    if (snake.game.status === 'paused') snake.resume()
    else snake.pause()
  }
}

snake.hydrate()

watch(
  () => Boolean(snake.game),
  async (playing) => {
    if (!playing) {
      stopLoop()
      return
    }
    await Promise.resolve()
    resizeBoard()
    startLoop()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (typeof ResizeObserver !== 'undefined') {
    boardObserver = new ResizeObserver(() => resizeBoard())
  }
  watch(
    board,
    (canvas) => {
      boardObserver?.disconnect()
      if (!canvas) return
      boardObserver?.observe(canvas)
      resizeBoard()
    },
    { immediate: true },
  )
})

onBeforeUnmount(() => {
  stopLoop()
  boardObserver?.disconnect()
  snake.pause()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main
    class="snake-app"
    :class="{ 'snake-app--playing': game }"
    :aria-label="phone.t('Apps.snake.name')"
  >
    <section v-if="!game" class="snake-menu">
      <div class="snake-mark" aria-hidden="true">
        <svg viewBox="0 0 512 512" role="presentation">
          <defs>
            <linearGradient
              id="snakeMenuBody"
              x1="90"
              y1="360"
              x2="380"
              y2="150"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stop-color="#DFF6E5" />
              <stop offset="1" stop-color="#FFFFFF" />
            </linearGradient>
          </defs>
          <path
            class="snake-mark__body"
            d="M140 340c56 0 56-88 112-88s56-88 112-88"
            fill="none"
            stroke="url(#snakeMenuBody)"
            stroke-linecap="round"
            stroke-width="46"
          />
          <circle cx="364" cy="164" r="33" fill="#FFFFFF" />
          <circle cx="376" cy="152" r="10" fill="#0E9B45" />
          <circle class="snake-mark__fruit" cx="152" cy="176" r="24" fill="#FF5C50" />
        </svg>
      </div>

      <div class="snake-menu__copy">
        <h1 class="sky-type-display">{{ phone.t('Apps.snake.readyTitle') }}</h1>
        <p>{{ phone.t('Apps.snake.readyBody') }}</p>
      </div>

      <div class="snake-best">
        <Trophy :size="15" :stroke-width="2.2" aria-hidden="true" />
        <span>{{ phone.t('Apps.snake.highScore') }}</span>
        <strong>{{ snake.highScore }}</strong>
      </div>

      <fieldset class="snake-speed-picker">
        <legend>{{ phone.t('Apps.snake.speed') }}</legend>
        <span
          class="snake-speed-picker__thumb"
          :style="{
            transform: `translate3d(${speedOptions.indexOf(snake.speed) * 100}%, 0, 0)`,
          }"
          aria-hidden="true"
        ></span>
        <button
          v-for="speed in speedOptions"
          :key="speed"
          type="button"
          :class="{ active: snake.speed === speed }"
          :aria-pressed="snake.speed === speed"
          @click="snake.setSpeed(speed)"
        >
          {{ phone.t(`Apps.snake.speeds.${speed}`) }}
        </button>
      </fieldset>

      <button type="button" class="snake-primary" @click="startGame">
        <Play :size="17" fill="currentColor" aria-hidden="true" />
        {{ phone.t('Apps.snake.start') }}
      </button>
    </section>

    <section v-else class="snake-game">
      <div class="snake-game__meta">
        <SkyButton
          glass
          icon-only
          rounded
          type="button"
          class="snake-game__control snake-game__back"
          :aria-label="phone.t('Apps.snake.backToMenu')"
          :title="phone.t('Apps.snake.backToMenu')"
          @click="returnToMenu"
        >
          <ChevronLeft :size="18" :stroke-width="2.7" aria-hidden="true" />
        </SkyButton>
        <div class="snake-game__score">
          <span class="sky-type-eyebrow">{{ phone.t('Apps.snake.score') }}</span>
          <strong class="sky-type-display">{{ game.score }}</strong>
        </div>
        <SkyButton
          v-if="game.status !== 'game-over'"
          glass
          icon-only
          rounded
          type="button"
          class="snake-game__control snake-game__pause"
          :aria-label="
            phone.t(
              game.status === 'paused'
                ? 'Apps.snake.resume'
                : 'Apps.snake.pause',
            )
          "
          @click="game.status === 'paused' ? snake.resume() : snake.pause()"
        >
          <Play
            v-if="game.status === 'paused'"
            :size="17"
            fill="currentColor"
          />
          <Pause v-else :size="17" fill="currentColor" />
        </SkyButton>
      </div>

      <div class="snake-board">
        <canvas
          ref="board"
          class="snake-board__canvas"
          role="img"
          :aria-label="phone.t('Apps.snake.board')"
          @pointercancel="onBoardPointerUp"
          @pointerdown="onBoardPointerDown"
          @pointerleave="onBoardPointerUp"
          @pointermove="onBoardPointerMove"
          @pointerup="onBoardPointerUp"
        ></canvas>

        <Transition name="snake-overlay">
          <div v-if="game.status !== 'playing'" class="snake-overlay">
            <template v-if="game.status === 'paused'">
              <h2 class="sky-type-display">
                {{ phone.t('Apps.snake.paused') }}
              </h2>
              <button type="button" class="snake-primary" @click="snake.resume">
                <Play :size="16" fill="currentColor" aria-hidden="true" />
                {{ phone.t('Apps.snake.resume') }}
              </button>
            </template>
            <template v-else>
              <span class="snake-overline sky-type-eyebrow">{{
                phone.t('Apps.snake.score')
              }}</span>
              <strong class="snake-overlay__score sky-type-display">{{
                game.score
              }}</strong>
              <h2 class="sky-type-display">
                {{ phone.t('Apps.snake.gameOver') }}
              </h2>
              <button type="button" class="snake-primary" @click="startGame">
                {{ phone.t('Apps.snake.restart') }}
              </button>
              <button
                type="button"
                class="snake-secondary"
                @click="returnToMenu"
              >
                {{ phone.t('Apps.snake.menu') }}
              </button>
            </template>
          </div>
        </Transition>
      </div>

      <p class="snake-hint">{{ phone.t('Apps.snake.swipeHint') }}</p>
    </section>
  </main>
</template>

<style scoped>
.snake-app {
  position: absolute;
  inset: 0;
  overflow: hidden;
  padding: 58px 20px 26px;
  color: #eaf7ec;
  background:
    radial-gradient(circle at 78% 6%, rgb(63 224 122 / 20%), transparent 42%),
    linear-gradient(168deg, #0f2a1c 0%, #0a1712 58%, #060d0b 100%);
  font-family: var(--sky-font-family);
  user-select: none;
  touch-action: none;
}

.snake-app--playing {
  padding: 0;
}

/* ---------- Menu ---------- */

.snake-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  text-align: center;
}

.snake-mark {
  width: 116px;
  height: 116px;
  display: grid;
  border-radius: 30px;
  background: linear-gradient(160deg, #1fc85f, #0e9b45);
  box-shadow:
    0 18px 34px rgb(6 60 26 / 42%),
    inset 0 1px 0 rgb(255 255 255 / 22%);
  place-items: center;
}

.snake-mark svg {
  width: 88px;
  height: 88px;
}

.snake-mark__body {
  animation: snake-mark-breathe 3.2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.snake-mark__fruit {
  animation: snake-mark-fruit 1.9s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes snake-mark-breathe {
  0%,
  100% {
    transform: scale(0.985);
  }

  50% {
    transform: scale(1.015);
  }
}

@keyframes snake-mark-fruit {
  0%,
  100% {
    transform: scale(0.9);
  }

  50% {
    transform: scale(1.1);
  }
}

.snake-menu__copy h1 {
  margin: 0;
  font-size: 27px;
  font-weight: 700;
}

.snake-menu__copy p {
  max-width: 240px;
  margin: 6px auto 0;
  color: #9fbcab;
  font-size: 13px;
  line-height: 1.4;
}

.snake-best {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: var(--sky-radius-pill);
  color: #cfe9d6;
  background: rgb(255 255 255 / 6%);
}

.snake-best span {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.75;
}

.snake-best strong {
  font-size: 15px;
  font-weight: 700;
}

.snake-speed-picker {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  padding: 3px;
  border: 0;
  border-radius: 13px;
  background: rgb(255 255 255 / 7%);
}

.snake-speed-picker legend {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

/* Un seul curseur translate remplace un fond par bouton : la bascule glisse
   au lieu de sauter d'un onglet a l'autre. */
.snake-speed-picker__thumb {
  position: absolute;
  z-index: 0;
  top: 3px;
  left: 3px;
  width: calc((100% - 6px) / 3);
  height: calc(100% - 6px);
  border-radius: 10px;
  background: #e4f7dd;
  box-shadow: 0 4px 12px rgb(0 0 0 / 22%);
  transition: transform 280ms var(--sky-ease-out);
}

.snake-speed-picker button {
  position: relative;
  z-index: 1;
  min-height: 34px;
  border: 0;
  border-radius: 10px;
  color: #9fbcab;
  background: transparent;
  font-size: 12px;
  font-weight: 650;
  transition: color 200ms ease;
}

.snake-speed-picker button.active {
  color: #0b2417;
}

.snake-primary {
  min-width: 168px;
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 22px;
  border: 0;
  border-radius: 15px;
  color: #06301a;
  background: linear-gradient(135deg, #6cec93, #23c866);
  box-shadow: 0 10px 22px rgb(24 156 74 / 30%);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.2px;
  transition: transform 160ms var(--sky-ease-out);
}

/* ---------- Partie ---------- */

.snake-game {
  position: absolute;
  inset: 0;
}

.snake-game__meta {
  position: absolute;
  z-index: 7;
  top: 64px;
  right: 18px;
  left: 18px;
  height: 44px;
  display: grid;
  box-sizing: border-box;
  grid-template-columns: 34px 1fr 34px;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 22px;
  background: rgb(9 24 18 / 62%);
  box-shadow: 0 8px 24px rgb(0 0 0 / 22%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.snake-game__score {
  display: grid;
  align-content: center;
  justify-items: center;
}

.snake-game__score span {
  color: #8fae9d;
  line-height: 12px;
}

.snake-game__score strong {
  font-size: 19px;
  font-weight: 700;
  line-height: 21px;
  font-variant-numeric: tabular-nums;
}

.snake-game__control {
  --sky-touch-target: 34px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
}

.snake-game__meta .snake-game__pause {
  justify-self: end;
}

.snake-game__meta .snake-game__back {
  justify-self: start;
}

.snake-board {
  position: absolute;
  top: 120px;
  right: 18px;
  bottom: 58px;
  left: 18px;
  overflow: hidden;
  border: 1px solid rgb(63 224 122 / 22%);
  border-radius: 20px;
  background:
    radial-gradient(circle at 50% 38%, rgb(63 224 122 / 9%), transparent 66%),
    #10241b;
  box-shadow:
    inset 0 0 55px rgb(0 0 0 / 30%),
    0 14px 34px rgb(0 0 0 / 26%);
}

.snake-board__canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.snake-overlay {
  position: absolute;
  z-index: 5;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgb(6 16 13 / 84%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.snake-overlay h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.snake-overlay__score {
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.snake-overlay .snake-primary {
  min-width: 150px;
  min-height: 42px;
  margin-top: 4px;
}

.snake-overline {
  color: #6cec93;
}

.snake-secondary {
  min-width: 150px;
  min-height: 40px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 13px;
  color: #b9cfc3;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
}

.snake-overlay-enter-active,
.snake-overlay-leave-active {
  transition: opacity 220ms ease;
}

.snake-overlay-enter-from,
.snake-overlay-leave-to {
  opacity: 0;
}

.snake-hint {
  position: absolute;
  z-index: 6;
  right: 34px;
  bottom: 22px;
  left: 34px;
  margin: 0;
  color: #7f9a8c;
  font-size: 10px;
  letter-spacing: 0.01em;
  text-align: center;
  pointer-events: none;
}

button:active {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .snake-mark__body,
  .snake-mark__fruit {
    animation: none;
  }

  .snake-speed-picker__thumb {
    transition: none;
  }
}
</style>
