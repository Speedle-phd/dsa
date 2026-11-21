import { brewElixir } from '@/controllers/alchemyController'
import { brewElixirSchema } from '@/validations/alchemyValidation'
import { addArtifact, artifactAction, createArtifact, getArtifacts, updateArtifact } from '@/controllers/artifactController'
import { artifactActionSchema, artifactFieldsSchema, createArtifactSchema, updateArtifactSchema } from '@/validations/artifactValidation'
import { Router } from 'express'
import {
   addCharacterEntry, getCharacterEntryReference, previewCharacterEntry,
   previewCharacterEntryRemoval, removeCharacterEntry,
} from '@/controllers/characterEntryController'
import { addCharacterEntrySchema, entryPreviewSchema, removeCharacterEntrySchema } from '@/validations/characterEntryValidation'
import {
   addCombatAbility, adjustHealthController, getCombatReference, useAmmunitionController, setWeaponConditionController, repairWeaponController,
   levelUpCombatTechnique, removeCombatAbility, updateCombatSettings,
} from '@/controllers/combatController'
import {
   addCombatAbilitySchema, combatSettingsSchema,
   healthAdjustmentSchema, levelUpCombatTechniqueSchema, removeCombatAbilitySchema, useAmmunitionSchema, weaponConditionSchema, repairWeaponSchema,
} from '@/validations/combatValidation'
import {
   deleteStats,
   getStats,
   getStatsByCharacterId,
   getStatsById,
   updateStats,
   levelUpAttribute,
   updateAdvantagesAbilities,
   updateExperience,
   incrementFatePointsController,
   spendFatePointController,
   restoreFatePointsController,
   regenerateController,
   purchaseAdditionalVitalResources,
   debugStatsController,
   updateTalents,
   levelUpTalent,
   updateLanguagesScripts,
   purchaseEquipmentController,
   adjustPurseController,
} from '@/controllers/statsController'
import { protect } from '@/middleware/auth'
import {
   addCompanion, addCompanionTrick, getCompanionReference, getCompanions, removeCompanion, removeCompanionTrick, setCompanionResources, updateCompanion,
} from '@/controllers/companionController'
import { addSummon, getBestiaryReference, getSummons, summonAction } from '@/controllers/summonController'
import { addBlessing, adjustKarma, changeLiturgy, getKarmaReference, removeBlessing, removeLiturgy, updateLiturgyNotes } from '@/controllers/karmaController'
import { karmaAdjustmentSchema, karmaRemoveSchema, liturgyChangeSchema, liturgyNotesSchema } from '@/validations/karmaValidation'
import { addSummonSchema, summonActionSchema } from '@/validations/summonValidation'
import {
   companionAddSchema, companionRemoveSchema, companionResourcesSchema, companionTrickSchema, companionUpdateSchema,
} from '@/validations/companionValidation'
import { adjustMana, changePermanentMana, changeSpell, changeTrick, getMagicReference, removeSpell, removeTrick, updateMagicSettings, updateSpellNotes } from '@/controllers/magicController'
import { magicRemoveSchema, magicSettingsSchema, manaAdjustmentSchema, permanentManaSchema, spellChangeSchema, spellNotesSchema } from '@/validations/magicValidation'
import { validateRequest } from '@/middleware/validateRequest'
import { addExtendedCheck, getExtendedChecks, recordExtendedCheckAttempt, removeExtendedCheck } from '@/controllers/extendedCheckController'
import { activeEffectActionController, consumeItemController, getActiveEffects, startAbilityEffectController } from '@/controllers/activeEffectController'
import { abilityEffectSchema, activeEffectActionSchema, consumeItemSchema } from '@/validations/activeEffectValidation'
import { getServiceReference, purchaseServiceController } from '@/controllers/serviceController'
import { purchaseServiceSchema } from '@/validations/serviceValidation'
import { addExtendedCheckSchema, extendedCheckAttemptSchema, removeExtendedCheckSchema } from '@/validations/extendedCheckValidation'
import {
   levelUpAttributeSchema,
   updateStatsSchema,
   updateAdvantagesAbilitiesSchema,
   updateExperienceSchema,
   vitalResourcesTypeSchema,
   updateTalentsSchema,
   levelUpTalentSchema,
   updateLanguagesScriptsSchema,
   purchaseEquipmentSchema,
   adjustPurseSchema,
   regenerationSchema,
} from '@/validations/statsValidation'

const router = Router()

router.get('/debug/:id', debugStatsController)

router.use(protect)

router.get('/', getStats)
router.get('/combat-reference', getCombatReference)
router.get('/magic-reference', getMagicReference)
router.get('/companion-reference', getCompanionReference)
router.get('/bestiary-reference', getBestiaryReference)
router.get('/service-reference', getServiceReference)
router.get('/companions/:id', getCompanions)
router.get('/summons/:id', getSummons)
router.put('/add-summon/:id', validateRequest(addSummonSchema), addSummon)
router.put('/summon-action/:id', validateRequest(summonActionSchema), summonAction)
router.put('/add-companion/:id', validateRequest(companionAddSchema), addCompanion)
router.put('/update-companion/:id', validateRequest(companionUpdateSchema), updateCompanion)
router.put('/companion-resources/:id', validateRequest(companionResourcesSchema), setCompanionResources)
router.put('/companion-trick/:id', validateRequest(companionTrickSchema), addCompanionTrick)
router.put('/remove-companion-trick/:id', validateRequest(companionTrickSchema), removeCompanionTrick)
router.put('/remove-companion/:id', validateRequest(companionRemoveSchema), removeCompanion)
router.put('/spell/:id', validateRequest(spellChangeSchema), changeSpell)
router.put('/remove-spell/:id', validateRequest(magicRemoveSchema), removeSpell)
router.put('/magic-trick/:id', validateRequest(magicRemoveSchema), changeTrick)
router.put('/remove-magic-trick/:id', validateRequest(magicRemoveSchema), removeTrick)
router.put('/spell-notes/:id', validateRequest(spellNotesSchema), updateSpellNotes)
router.put('/magic-settings/:id', validateRequest(magicSettingsSchema), updateMagicSettings)
router.put('/adjust-mana/:id', validateRequest(manaAdjustmentSchema), adjustMana)
router.put('/permanent-mana/:id', validateRequest(permanentManaSchema), changePermanentMana)
router.get('/karma-reference', getKarmaReference)
router.put('/liturgy/:id', validateRequest(liturgyChangeSchema), changeLiturgy)
router.put('/remove-liturgy/:id', validateRequest(karmaRemoveSchema), removeLiturgy)
router.put('/liturgy-notes/:id', validateRequest(liturgyNotesSchema), updateLiturgyNotes)
router.put('/blessing/:id', validateRequest(karmaRemoveSchema), addBlessing)
router.put('/remove-blessing/:id', validateRequest(karmaRemoveSchema), removeBlessing)
router.put('/adjust-karma/:id', validateRequest(karmaAdjustmentSchema), adjustKarma)
router.get('/character-entry-reference', getCharacterEntryReference)
router.post('/character-entry-preview/:id', validateRequest(entryPreviewSchema), previewCharacterEntry)
router.post('/character-entry-removal-preview/:id', validateRequest(removeCharacterEntrySchema), previewCharacterEntryRemoval)
router.put('/character-entry/:id', validateRequest(addCharacterEntrySchema), addCharacterEntry)
router.put('/remove-character-entry/:id', validateRequest(removeCharacterEntrySchema), removeCharacterEntry)
router.get('/character/:charId', getStatsByCharacterId)
router.get('/:id', getStatsById)
router.put('/update/:id', validateRequest(updateStatsSchema), updateStats)
router.put('/combat-technique-level-up/:id', validateRequest(levelUpCombatTechniqueSchema), levelUpCombatTechnique)
router.put('/combat-ability/:id', validateRequest(addCombatAbilitySchema), addCombatAbility)
router.put('/remove-combat-ability/:id', validateRequest(removeCombatAbilitySchema), removeCombatAbility)
router.put('/combat-settings/:id', validateRequest(combatSettingsSchema), updateCombatSettings)
router.put('/adjust-health/:id', validateRequest(healthAdjustmentSchema), adjustHealthController)
router.put('/use-ammunition/:id', validateRequest(useAmmunitionSchema), useAmmunitionController)
router.put('/weapon-condition/:id', validateRequest(weaponConditionSchema), setWeaponConditionController)
router.put('/repair-weapon/:id', validateRequest(repairWeaponSchema), repairWeaponController)
router.put(
   '/purchase-equipment/:id',
   validateRequest(purchaseEquipmentSchema),
   purchaseEquipmentController,
)
router.put(
   '/adjust-purse/:id',
   validateRequest(adjustPurseSchema),
   adjustPurseController,
)
router.put(
   '/attribute-level-up/:id',
   validateRequest(levelUpAttributeSchema),
   levelUpAttribute,
)
router.put(
   '/advantages-abilities/:id',
   validateRequest(updateAdvantagesAbilitiesSchema),
   updateAdvantagesAbilities,
)
router.put(
   '/experience/:id',
   validateRequest(updateExperienceSchema),
   updateExperience,
)
router.put('/increment-fate-points/:id', incrementFatePointsController)
router.put('/spend-fate-point/:id', spendFatePointController)
router.put('/restore-fate-points/:id', restoreFatePointsController)
router.put('/regenerate/:id', validateRequest(regenerationSchema), regenerateController)
router.get('/extended-checks/:id', getExtendedChecks)
router.put('/add-extended-check/:id', validateRequest(addExtendedCheckSchema), addExtendedCheck)
router.put('/extended-check-attempt/:id', validateRequest(extendedCheckAttemptSchema), recordExtendedCheckAttempt)
router.put('/remove-extended-check/:id', validateRequest(removeExtendedCheckSchema), removeExtendedCheck)
router.get('/active-effects/:id', getActiveEffects)
router.put('/consume-item/:id', validateRequest(consumeItemSchema), consumeItemController)
router.put('/active-effect/:id', validateRequest(activeEffectActionSchema), activeEffectActionController)
router.put('/ability-effect/:id', validateRequest(abilityEffectSchema), startAbilityEffectController)
router.get('/artifacts/:id', getArtifacts)
router.put('/add-artifact/:id', validateRequest(artifactFieldsSchema), addArtifact)
router.put('/update-artifact/:id', validateRequest(updateArtifactSchema), updateArtifact)
router.put('/artifact-action/:id', validateRequest(artifactActionSchema), artifactAction)
router.put('/create-artifact/:id', validateRequest(createArtifactSchema), createArtifact)
router.put('/brew-elixir/:id', validateRequest(brewElixirSchema), brewElixir)
router.put('/purchase-service/:id', validateRequest(purchaseServiceSchema), purchaseServiceController)
router.put(
   '/purchase-additional-vital-resources/:id',
   validateRequest(vitalResourcesTypeSchema),
   purchaseAdditionalVitalResources,
)
router.put('/talents/:id', validateRequest(updateTalentsSchema), updateTalents)
router.put(
   '/talent-level-up/:id',
   validateRequest(levelUpTalentSchema),
   levelUpTalent,
)
router.put(
   '/languages-scripts/:id',
   validateRequest(updateLanguagesScriptsSchema),
   updateLanguagesScripts,
)

router.delete('/:id', deleteStats)

export default router
