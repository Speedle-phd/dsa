declare module '@3d-dice/dice-box' {
   export interface DiceNotation {
      qty: number
      sides: number
      themeColor?: string
      data?: string
   }

   export interface DieResult {
      sides: number
      value: number
      groupId: number
      rollId: number
      themeColor: string
      data?: string
   }

   export interface DiceBoxConfig {
      assetPath: string
      container?: string
      id?: string
      offscreen?: boolean
      scale?: number
      theme?: string
      themeColor?: string
      throwForce?: number
      spinForce?: number
      startingHeight?: number
      settleTimeout?: number
      onRollComplete?: () => void
   }

   export default class DiceBox {
      constructor(config: DiceBoxConfig)
      init(): Promise<DiceBox>
      roll(notation: DiceNotation | DiceNotation[]): Promise<DieResult[]>
      clear(): DiceBox
      hide(className?: string): DiceBox
      show(): DiceBox
   }
}
