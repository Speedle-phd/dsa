import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { axiosInstance } from '@/axios/axios'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { getErrorMessage } from '@/utils/errorHandling'
import type { Stats } from './statsApi'
import type { TalentAttribute } from './talentCatalog'

export type Church = 'Boron' | 'Hesinde' | 'Peraine' | 'Phex' | 'Praios' | 'Rondra'
export type Liturgy = {
   key: string
   kind: 'Liturgie' | 'Zeremonie'
   probe: [TalentAttribute, TalentAttribute, TalentAttribute]
   resistance: 'SK' | 'ZK' | null
   stfClass: 'a' | 'b' | 'c'
   cost: string
   costModifiable: boolean
   castingTime: string
   range: string
   duration: string
   target: string
   distribution: Array<{ church: Church | 'allgemein'; aspects: string[] }>
   page: number
   effect: { de: string; en: string }
}
export type Blessing = { key: string; god: string; range: string; duration: string; target: string; page: number; effect: { de: string; en: string } }
export type KarmaReference = {
   liturgies: Liturgy[]
   blessings: Blessing[]
   twelveBlessings: { key: string; ap: number }
   churches: Array<{ church: Church; tradition: string }>
   steps: { Liturgie: { time: string[]; cost: string[] }; Zeremonie: { time: string[]; cost: string[] }; range: string[] }
}
export type KarmaAction =
   | { action: 'liturgy'; key: string; value?: number; spendAP: boolean }
   | { action: 'remove-liturgy' | 'blessing' | 'remove-blessing'; key: string; spendAP: boolean }
   | { action: 'liturgy-notes'; key: string; notes: string }

export const karmaReferenceKey = ['karma-reference']
export async function getKarmaReference() {
   return (await axiosInstance.get<KarmaReference>('/api/stats/karma-reference')).data
}
export async function updateKarma(id: string, input: KarmaAction) {
   const { action, ...payload } = input
   return (await axiosInstance.put<{ stats: Stats }>(`/api/stats/${action}/${id}`, payload)).data.stats
}

export const heroChurch = (stats: Pick<Stats, 'generalSpecialAbilities'>, reference: KarmaReference) =>
   reference.churches.find((entry) => stats.generalSpecialAbilities.includes(entry.tradition))?.church ?? null
// Only general liturgies and those of the own church (S. 322; UX mirror, the server validates)
export const liturgyAvailable = (liturgy: Liturgy, church: Church | null) =>
   liturgy.distribution.some((entry) => entry.church === 'allgemein' || entry.church === church)

// source: DSA5 Regelwerk, S. 39, 321 (check + 2; above 14 only with Aspektkenntnis of one of its aspects)
export function liturgyMaximum(stats: Stats, liturgy: Liturgy, church: Church | null) {
   const aspects = liturgy.distribution.filter((entry) => entry.church === church || entry.church === 'allgemein')
      .flatMap((entry) => entry.church === 'allgemein' ? ['allgemein'] : entry.aspects)
   const knowledge = aspects.some((aspect) => stats.generalSpecialAbilities.includes(`Aspektkenntnis (${aspect})`))
   return Math.min(25, Math.max(...liturgy.probe.map((attribute) => stats[attribute])) + 2, knowledge ? 25 : 14)
}

// source: DSA5 Regelwerk, S. 309, 311, 314 (success: full KaP; failure: half of base + first interval; critical: half), app rounding up
// null when the cost depends on the situation (per LeP, per poison level …)
export function suggestedLiturgyCost(cost: string, outcome: 'success' | 'failure' | 'critical') {
   const match = /^(\d+) KaP(?: \(Aktivierung[^)]*\))?(?: \+ (\d+) KaP pro)?/.exec(cost.trim())
   if (!match) return null
   const first = Number(match[1])
   if (outcome === 'success') return first
   if (outcome === 'critical') return Math.ceil(first / 2)
   return Math.ceil((first + Number(match[2] ?? 0)) / 2)
}

// source: DSA5 Regelwerk, S. 314 (Patzertabelle für Liturgien und Zeremonien, 2W6)
export const liturgyBotchTable: Record<number, { de: string; en: string }> = {
   2: { de: 'Brennbares im Umkreis von 2W6 Metern fängt Feuer (nicht Lebewesen und die Kleidung des Geweihten).', en: 'Flammable material within 2W6 metres catches fire (not living beings or the priest’s clothing).' },
   3: { de: 'Die Liturgie bewirkt das Gegenteil.', en: 'The liturgy has the opposite effect.' },
   4: { de: 'Der Meister wählt ein zufälliges neues Ziel.', en: 'The GM picks a random new target.' },
   5: { de: '1W6 Tage lang seltsame Visionen und Albträume.', en: 'Strange visions and nightmares for 1W6 days.' },
   6: { de: 'Ein Blick in die Sphären: einen Tag lang 3 Stufen Furcht.', en: 'A glimpse into the spheres: 3 levels of Furcht for a day.' },
   7: { de: '1W6 Tage kein Zugriff auf die Karmaenergie.', en: 'No access to karma energy for 1W6 days.' },
   8: { de: 'Einen Tag lang 4 Stufen Entrückung.', en: '4 levels of Entrückung for a day.' },
   9: { de: 'Einen Tag lang 3 Stufen Verwirrung.', en: '3 levels of Verwirrung for a day.' },
   10: { de: '1W6 Tage lang stumm.', en: 'Mute for 1W6 days.' },
   11: { de: 'Einen Tag lang ein Stigma.', en: 'A stigma for a day.' },
   12: { de: '1W6 Minuten mit dem Boden verwurzelt: Status Fixiert.', en: 'Rooted to the ground for 1W6 minutes: status Fixiert.' },
}

// KaP spends go through the server so Schwacher Karmalkörper applies (S. 177)
export function useKarmaSpend(stats: Stats, onSpent?: (amount: number) => void) {
   const queryClient = useQueryClient()
   const language = useLanguageStore((state) => state.language)
   return useMutation({
      mutationFn: async ({ amount, direction = 'spend' }: { amount: number; direction?: 'spend' | 'recover' }) =>
         (await axiosInstance.put<{ stats: Stats; spend: { total: number; extra: number } }>(`/api/stats/adjust-karma/${stats._id}`, { direction, amount })).data,
      onSuccess: ({ stats: next, spend }, { amount }) => {
         queryClient.setQueryData(['stats', stats.charId], next)
         if (spend.extra) toast(t('Schwacher Karmalkörper: 1 KaP more (S. 177).', language))
         onSpent?.(amount)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
   })
}
