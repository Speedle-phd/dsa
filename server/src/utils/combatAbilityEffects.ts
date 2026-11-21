export type CombatAbilityEffect = { page: number; de: string; en: string }

// source: DSA5 Regelwerk, S. 246–250 (concise effect summaries, not maneuver prose)
const effects: Record<string, CombatAbilityEffect> = {
   Aufmerksamkeit: { page: 246, de: 'Hinterhalte entdecken: Sinnesschärfe +2.', en: 'Gain +2 to Sinnesschärfe when detecting an ambush.' },
   Belastungsgewöhnung: { page: 246, de: 'Je Stufe zwei Rüstungszeilen weniger Behinderung für BE, GS und INI; RS unverändert.', en: 'Per level, use an armor entry two rows lighter for BE, GS and INI penalties; RS stays unchanged.' },
   'Beidhändiger Kampf': { page: 246, de: 'Beidhändiger Kampf: AT/PA-Abzug −1 mit I, kein Abzug mit II.', en: 'Dual-wielding AT/PA penalty becomes −1 at I and zero at II.' },
   'Berittener Kampf': { page: 247, de: 'Erlaubt besondere Reiterkampf-Befehle, etwa Niederreiten.', en: 'Unlocks special mounted-combat commands, such as riding down an opponent.' },
   'Berittener Schütze': { page: 247, de: 'Schuss im Schritt ohne Abzug, im Galopp −4 (auch nach hinten); im Trab nur Glückstreffer.', en: 'Mounted shooting: no penalty at a walk, −4 at a gallop (including backwards); trotting still requires a lucky hit.' },
   'Einhändiger Kampf': { page: 247, de: 'Nur eine einhändige Waffe, andere Hand leer: AT, PA und TP je +1 (Fechtwaffen/Schwerter).', en: 'One one-handed weapon with the other hand empty: +1 AT, PA and TP (Fechtwaffen/Schwerter).' },
   Entwaffnen: { page: 247, de: 'AT −4, gegen Zweihandwaffen −6: bei gescheiterter Abwehr Waffe fallen lassen; 1W3 TP. Keine Schilde.', en: 'AT −4 (−6 against two-handed weapons): failed defense drops the weapon; 1W3 TP. Cannot disarm shields.' },
   Feindgespür: { page: 247, de: 'Gegnerische Passierschläge zusätzlich −4.', en: 'Opportunity attacks against you suffer an additional −4.' },
   Finte: { page: 247, de: 'Je eingesetzter Stufe AT −1; bei Erfolg gegnerische Verteidigung −2.', en: 'Per level used: AT −1; a successful attack imposes −2 on the opponent’s defense.' },
   Haltegriff: { page: 248, de: 'Raufen mit freien Händen: Gegner gleicher/kleinerer Größe festhalten (Fixiert, Eingeengt). Haltender ohne Verteidigung; Befreiung über Kraftakt-Vergleich.', en: 'Unarmed grapple with both hands free against equal/smaller foes: Fixiert and Eingeengt. You cannot defend while holding; escape uses opposed Kraftakt.' },
   Hammerschlag: { page: 248, de: 'AT −2, TP +1W6; Fehlschlag erlaubt gegnerischen Passierschlag.', en: 'AT −2, add 1W6 TP; failure grants the defender an opportunity attack.' },
   Kampfreflexe: { page: 248, de: 'INI-Basiswert +1 je Stufe.', en: 'Initiative base +1 per level.' },
   Klingenfänger: { page: 248, de: 'Passiver PA-Bonus der geführten Parierwaffe +1.', en: 'Increase the wielded parrying weapon’s passive PA bonus by 1.' },
   Kreuzblock: { page: 248, de: 'Mit zwei Waffen können Dolche/Fechtwaffen auch Ketten-, Stangen- und Zweihandwaffen parieren; kein Abzug für die falsche Hand.', en: 'With two weapons, Dolche/Fechtwaffen may parry chain, pole and two-handed weapons; no off-hand penalty for this parry.' },
   Lanzenangriff: { page: 248, de: 'Lanzenangriff im Galopp nach Reiten-Probe; TP +2 + halbe Reittier-GS. Abwehr nur Schild/AW; Lanze bei Treffer oder Schildparade loslassen.', en: 'Galloping lance command after a riding check: TP +2 + half mount GS. Only shield/dodge defense; release the lance after a hit or shield parry.' },
   'Präziser Schuss/Wurf': { page: 248, de: 'Je eingesetzter Stufe FK −2, bei Erfolg TP +2.', en: 'Per level used: FK −2, successful hit gains +2 TP.' },
   'Präziser Stich': { page: 249, de: 'Dolche/Fechtwaffen: je eingesetzter Stufe AT −2, bei Erfolg TP +2.', en: 'Dolche/Fechtwaffen: per level used, AT −2 and a successful hit gains +2 TP.' },
   Riposte: { page: 249, de: 'Vor gegnerischer AT ansagen: PA −2; erfolgreiche PA erlaubt sofort Passierschlag. Danach keine Verteidigung in dieser KR; kein Basismanöver.', en: 'Declare before the enemy attack: PA −2; success grants an immediate opportunity attack. No further defense this round or combination with a basic maneuver.' },
   Rundumschlag: { page: 249, de: 'I: zwei Gegner; II: drei. Einzelne AT mit −2/−6/−10, getrennte Abwehr und Schaden; Patzer beendet die Angriffsfolge.', en: 'I targets two foes, II three: separate AT at −2/−6/−10, defenses and damage. A fumble ends the sequence.' },
   Schildspalter: { page: 249, de: 'Schild angreifen; Schildparade ohne Schildbonus oder AW. Treffer schädigt Strukturpunkte; bei 0 Schild zerstört.', en: 'Attack a shield; defend by dodge or shield PA without its bonus. Damage reduces structure points; zero destroys the shield.' },
   'Schnellladen (Armbrüste)': { page: 249, de: 'Ladezeit der Armbrust halbieren.', en: 'Halve crossbow reload actions.' },
   'Schnellladen (Bögen)': { page: 249, de: 'Ladezeit des Bogens um eine Aktion verkürzen.', en: 'Bow reload takes one fewer action.' },
   'Schnellladen (Wurfwaffen)': { page: 249, de: 'Wurfwaffe eine Aktion schneller bereitmachen.', en: 'Ready a throwing weapon in one fewer action.' },
   Schnellziehen: { page: 249, de: 'Waffe mit freier Aktion statt Aktion ziehen.', en: 'Draw a weapon with a free action instead of an action.' },
   Sturmangriff: { page: 249, de: 'Mindestens 4 Schritt Anlauf und GS 4: AT −2, TP +2 + halbe GS; Fehlschlag erlaubt Passierschlag. Nicht mit Finte.', en: 'Requires a 4-Schritt run-up and GS 4: AT −2, TP +2 + half GS; failure grants an opportunity attack. Cannot combine with Finte.' },
   Todesstoß: { page: 250, de: 'Dolche/Fechtwaffen: AT −2, TP +1W6; Fehlschlag erlaubt Passierschlag.', en: 'Dolche/Fechtwaffen: AT −2, add 1W6 TP; failure grants an opportunity attack.' },
   'Verbessertes Ausweichen': { page: 250, de: 'AW +1 je Stufe, nur mit normaler Kleidung (RS 0).', en: 'AW +1 per level, usable only in ordinary clothing (RS 0).' },
   Verteidigungshaltung: { page: 250, de: 'Zu KR-Beginn ansagen: Verteidigung +4, keine Aktionen in dieser KR.', en: 'Declare at round start: defense +4, but no actions this round.' },
   Vorstoß: { page: 250, de: 'Zu KR-Beginn ansagen: AT +2, keine Verteidigung in dieser KR; nicht Liegend.', en: 'Declare at round start: AT +2, but no defense this round; cannot be used while Liegend.' },
   Wuchtschlag: { page: 250, de: 'Je eingesetzter Stufe AT −2, bei Erfolg TP +2.', en: 'Per level used: AT −2, successful hit gains +2 TP.' },
   Wurf: { page: 250, de: 'Aus Haltegriff: Raufen-AT −2; bei gescheiterter Abwehr Gegner Liegend, 1W3 TP, bis 1 Schritt werfen.', en: 'From Haltegriff: Raufen AT −2; failed defense makes the foe Liegend, deals 1W3 TP and throws them up to 1 Schritt.' },
   'Zu Fall bringen': { page: 250, de: 'Stangenwaffen-AT −4; bei gescheiterter Abwehr Gegner Liegend und 1W3 TP.', en: 'Stangenwaffen AT −4; failed defense makes the foe Liegend and deals 1W3 TP.' },
}

export function combatAbilityEffect(key: string): CombatAbilityEffect | undefined {
   return effects[key] ?? effects[key.replace(/ (I|II|III)$/, '')]
}
