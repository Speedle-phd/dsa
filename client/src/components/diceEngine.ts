import type DiceBox from '@3d-dice/dice-box'
import type { DiceNotation } from '@3d-dice/dice-box'
import { quickRolls } from './diceSettings'

const hiddenCanvasClass = 'dice-box-canvas--hide'
const visibleAfterRollMs = 2500

let box: DiceBox | null = null
let loading: Promise<DiceBox> | null = null
let hideTimeout: number | undefined

function scheduleHide() {
   window.clearTimeout(hideTimeout)
   hideTimeout = window.setTimeout(() => box?.hide(hiddenCanvasClass), visibleAfterRollMs)
}

// Firefox schedules frames of a WebGL OffscreenCanvas worker less evenly, and with fingerprinting protection it caps frames
// at 60 fps with a coarse clock. The dice physics advance by the time between frames (at most 2 × 1/90 s per frame), so late
// frames make the dice stutter in slow motion. There the dice render on the page and without the shadow (cheaper frames).
const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent)

function loadDiceBox() {
   loading ??= import('@3d-dice/dice-box')
      .then(async ({ default: DiceBoxEngine }) => {
         const engine = new DiceBoxEngine({
            assetPath: '/assets/dice-box/',
            container: '#dice-roll-layer',
            id: 'dice-roll-canvas',
            scale: 5,
            theme: 'default',
            themeColor: '#20734a',
            // Quicker throws (user feedback: rolls felt slow): stronger gravity and damping, lower drop, shorter settle wait
            gravity: 6,
            throwForce: 4,
            spinForce: 4,
            startingHeight: 5,
            linearDamping: 0.75,
            angularDamping: 0.75,
            // Safety net only: dice normally rest after about a second
            settleTimeout: 2500,
            offscreen: !isFirefox,
            enableShadows: !isFirefox,
            onRollComplete: scheduleHide,
         })
         await engine.init()
         box = engine
         return engine
      })
      .catch((error: unknown) => {
         loading = null
         throw error
      })
   return loading
}

// Loads the 3D dice in the background (after sign-in), so the first roll does not wait for the engine
export function preloadDice() {
   if (!quickRolls()) loadDiceBox().catch(() => undefined)
}

type RolledDie = { value: number; sides: number; data?: string }

// Throws the dice on the shared 3D layer and resolves with each die's value, tagged by `data`.
// Quick rolls (setting or "reduce motion") skip the animation and roll at once.
export async function throwDice(notation: DiceNotation[]): Promise<RolledDie[]> {
   if (quickRolls()) {
      return notation.flatMap((group) => Array.from({ length: Number(group.qty ?? 1) }, () => {
         const sides = Number(group.sides)
         return { value: randomDie(sides), sides, data: typeof group.data === 'string' ? group.data : undefined }
      }))
   }
   window.clearTimeout(hideTimeout)
   const engine = await loadDiceBox()
   engine.clear().show()
   return engine.roll(notation)
}

const randomDie = (sides: number) => (crypto.getRandomValues(new Uint32Array(1))[0] % sides) + 1

// One die per colour; falls back to random numbers when the 3D dice cannot load.
// The 3D dice exist as W4, W6, W8, W10, W12, W20 and W100. A W2 or W3 is thrown as a W6 and halved or thirded
// (W3: 1–2 → 1, 3–4 → 2, 5–6 → 3), so these rolls are visible too.
const physicalDice = new Set([4, 6, 8, 10, 12, 20, 100])
export function physicalDie(sides: number) {
   if (physicalDice.has(sides)) return { sides, value: (rolled: number) => rolled }
   if (6 % sides === 0) return { sides: 6, value: (rolled: number) => Math.ceil(rolled / (6 / sides)) }
   return null
}

export async function throwColoredDice(sides: number, colors: readonly string[]) {
   const die = physicalDie(sides)
   if (!die) return colors.map(() => randomDie(sides))
   try {
      const results = await throwDice(colors.map((themeColor, index) => ({ qty: 1, sides: die.sides, themeColor, data: String(index) })))
      return colors.map((_, index) => {
         const rolled = results.find((entry) => entry.data === String(index))?.value
         return rolled === undefined ? randomDie(sides) : die.value(rolled)
      })
   } catch {
      return colors.map(() => randomDie(sides))
   }
}

export const throwD20s = (colors: readonly string[]) => throwColoredDice(20, colors)
