import type DiceBox from '@3d-dice/dice-box'
import type { DiceNotation } from '@3d-dice/dice-box'

const hiddenCanvasClass = 'dice-box-canvas--hide'
const visibleAfterRollMs = 2500

let box: DiceBox | null = null
let loading: Promise<DiceBox> | null = null
let hideTimeout: number | undefined

function scheduleHide() {
   window.clearTimeout(hideTimeout)
   hideTimeout = window.setTimeout(() => box?.hide(hiddenCanvasClass), visibleAfterRollMs)
}

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
            throwForce: 6,
            settleTimeout: 4000,
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

// Throws the dice on the shared 3D layer and resolves with each die's value, tagged by `data`.
export async function throwDice(notation: DiceNotation[]) {
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
