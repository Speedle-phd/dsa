import { Router } from 'express'
import { protect } from '@/middleware/auth'
import { validateRequest } from '@/middleware/validateRequest'
import {
   answerRequest,
   createParty,
   getParty,
   getPartySheet,
   listParties,
   previewInvite,
   removeMember,
   requestJoin,
   rotateInviteCode,
   setVisibility,
   updateParty,
} from '@/controllers/partyController'
import { createPartySchema, joinPartySchema, memberVisibilitySchema, updatePartySchema } from '@/validations/partyValidation'
import {
   addNpcs, changeTurn, damageCombatant, endEncounter, getEncounter, moveCombatant, removeCombatant, resizeBoard,
   rollNpcInitiative, startEncounter, updateCombatant,
} from '@/controllers/encounterController'
import {
   addNpcsSchema, boardSchema, damageSchema, npcInitiativeSchema, positionSchema, startEncounterSchema, turnSchema, updateCombatantSchema,
} from '@/validations/encounterValidation'

const router = Router()

router.use(protect)

router.get('/', listParties)
router.post('/', validateRequest(createPartySchema), createParty)
// Invite routes before /:id
router.get('/join/:code', previewInvite)
router.post('/join/:code', validateRequest(joinPartySchema), requestJoin)
router.get('/:id', getParty)
router.patch('/:id', validateRequest(updatePartySchema), updateParty)
router.post('/:id/invite-code', rotateInviteCode)
router.post('/:id/members/:charId/:answer', answerRequest)
router.patch('/:id/members/:charId', validateRequest(memberVisibilitySchema), setVisibility)
router.delete('/:id/members/:charId', removeMember)
router.get('/:id/heroes/:charId/sheet', getPartySheet)
// Shared fight and battle board
router.get('/:id/encounter', getEncounter)
router.post('/:id/encounter', validateRequest(startEncounterSchema), startEncounter)
router.post('/:id/encounter/end', endEncounter)
router.post('/:id/encounter/turn', validateRequest(turnSchema), changeTurn)
router.put('/:id/encounter/board', validateRequest(boardSchema), resizeBoard)
router.post('/:id/encounter/npcs', validateRequest(addNpcsSchema), addNpcs)
router.post('/:id/encounter/npc-initiative', validateRequest(npcInitiativeSchema), rollNpcInitiative)
router.patch('/:id/encounter/combatants/:combatantId', validateRequest(updateCombatantSchema), updateCombatant)
router.post('/:id/encounter/combatants/:combatantId/damage', validateRequest(damageSchema), damageCombatant)
router.put('/:id/encounter/combatants/:combatantId/position', validateRequest(positionSchema), moveCombatant)
router.delete('/:id/encounter/combatants/:combatantId', removeCombatant)

export default router
