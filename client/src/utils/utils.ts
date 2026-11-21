import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export { getErrorMessage } from './errorHandling'

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs))
}

export const conversionTable = {
   currency: {
      kreuzerToHeller: 10,
      hellerToSilbertaler: 10,
      silbertalerToDukaten: 10,

      // Kreuzer ↔ Heller
      calcKreuzerToHeller: (kreuzer: number) =>
         kreuzer / conversionTable.currency.kreuzerToHeller,

      calcHellerToKreuzer: (heller: number) =>
         heller * conversionTable.currency.kreuzerToHeller,

      // Heller ↔ Silbertaler
      calcHellerToSilbertaler: (heller: number) =>
         heller / conversionTable.currency.hellerToSilbertaler,

      calcSilbertalerToHeller: (silbertaler: number) =>
         silbertaler * conversionTable.currency.hellerToSilbertaler,

      // Silbertaler ↔ Dukaten
      calcSilbertalerToDukaten: (silbertaler: number) =>
         silbertaler / conversionTable.currency.silbertalerToDukaten,

      calcDukatenToSilbertaler: (dukaten: number) =>
         dukaten * conversionTable.currency.silbertalerToDukaten,

      // Heller ↔ Dukaten
      calcHellerToDukaten: (heller: number) =>
         heller /
         (conversionTable.currency.hellerToSilbertaler *
            conversionTable.currency.silbertalerToDukaten),

      calcDukatenToHeller: (dukaten: number) =>
         dukaten *
         conversionTable.currency.silbertalerToDukaten *
         conversionTable.currency.hellerToSilbertaler,

      // Kreuzer ↔ Silbertaler
      calcKreuzerToSilbertaler: (kreuzer: number) =>
         kreuzer /
         (conversionTable.currency.kreuzerToHeller *
            conversionTable.currency.hellerToSilbertaler),

      calcSilbertalerToKreuzer: (silbertaler: number) =>
         silbertaler *
         conversionTable.currency.hellerToSilbertaler *
         conversionTable.currency.kreuzerToHeller,

      // Kreuzer ↔ Dukaten
      calcKreuzerToDukaten: (kreuzer: number) =>
         kreuzer /
         (conversionTable.currency.kreuzerToHeller *
            conversionTable.currency.hellerToSilbertaler *
            conversionTable.currency.silbertalerToDukaten),

      calcDukatenToKreuzer: (dukaten: number) =>
         dukaten *
         conversionTable.currency.silbertalerToDukaten *
         conversionTable.currency.hellerToSilbertaler *
         conversionTable.currency.kreuzerToHeller,
   },

   weight: {
      steinToUnze: 40,

      calcSteinToUnze: (stein: number) =>
         stein * conversionTable.weight.steinToUnze,

      calcUnzeToStein: (unze: number) =>
         unze / conversionTable.weight.steinToUnze,
   },

   measurement: {
      schrittToHalbfinger: 100,

      calcSchrittToHalbfinger: (schritt: number) =>
         schritt * conversionTable.measurement.schrittToHalbfinger,

      calcHalbfingerToSchritt: (halbfinger: number) =>
         halbfinger / conversionTable.measurement.schrittToHalbfinger,
   },
}
