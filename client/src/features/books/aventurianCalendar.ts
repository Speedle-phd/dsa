// In-game date as a day number: 0 = 1 Praios 0 BF. User decision, Nov 2026: the common Aventurian calendar with
// 12 god months of 30 days and 5 Namenlose Tage (365 days). The core rulebook names the gods (S. 10) and the
// Namenlose Tage (S. 398) but does not define the calendar; Archiv der Kräuter does not either.
export const calendarMonths = ['Praios', 'Rondra', 'Efferd', 'Travia', 'Boron', 'Hesinde', 'Firun', 'Tsa', 'Phex', 'Peraine', 'Ingerimm', 'Rahja', 'Namenlose Tage'] as const
export const daysPerYear = 365
const namelessDays = 5

export type AventurianDate = { year: number; month: number; day: number }

export const daysInMonth = (month: number) => (month === 12 ? namelessDays : 30)

export function toAventurianDate(dayNumber: number): AventurianDate {
   const year = Math.floor(dayNumber / daysPerYear)
   const dayOfYear = dayNumber - year * daysPerYear
   const month = Math.min(12, Math.floor(dayOfYear / 30))
   return { year, month, day: dayOfYear - month * 30 + 1 }
}

// null when the date does not exist (e.g. 31 Praios or a 6th Namenloser Tag)
export function fromAventurianDate({ year, month, day }: AventurianDate): number | null {
   if (!Number.isInteger(year) || year < 0 || !Number.isInteger(month) || month < 0 || month > 12) return null
   if (!Number.isInteger(day) || day < 1 || day > daysInMonth(month)) return null
   return year * daysPerYear + month * 30 + day - 1
}

// "3. Peraine 1045 BF"; the Namenlose Tage as "2. Namenloser Tag 1045 BF"
export function formatAventurianDate(dayNumber: number, language: 'de' | 'en') {
   const { year, month, day } = toAventurianDate(dayNumber)
   if (month === 12) return language === 'de' ? `${day}. Namenloser Tag ${year} BF` : `Nameless Day ${day}, ${year} BF`
   return language === 'de' ? `${day}. ${calendarMonths[month]} ${year} BF` : `${day} ${calendarMonths[month]} ${year} BF`
}
