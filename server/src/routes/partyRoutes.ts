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
   updatePartyCalendar,
   updatePartyRules,
} from '@/controllers/partyController'
import { calendarActionSchema, partyRulesSchema } from '@/validations/bookValidation'
import { createPartySchema, joinPartySchema, memberVisibilitySchema, updatePartySchema } from '@/validations/partyValidation'
import {
   addNpcs, changeTurn, damageCombatant, endEncounter, getEncounter, moveCombatant, removeCombatant, resizeBoard,
   rollNpcInitiative, startEncounter, updateCombatant, submitAttack, resolveDefense, cancelAttack,
   endTurn, setObstacles, addAlly, removeAlly, spendAction, updatePanel, rollAttackDamage, grantPassing, getPreparedEncounter, listPrepared, createPrepared, deletePrepared, activatePrepared,
} from '@/controllers/encounterController'
import {
   addNpcsSchema, attackSchema, boardSchema, damageSchema, defenseSchema, npcInitiativeSchema, positionSchema, startEncounterSchema, turnSchema, updateCombatantSchema,
   obstaclesSchema, allySchema, actionSchema, panelSchema, damageRollSchema, preparedSchema, passingGrantSchema,
} from '@/validations/encounterValidation'

import { answerCheckRequest, closeCheckRequest, createCheckRequest, declineCheckRequest, listCheckRequests } from '@/controllers/checkRequestController'
import { checkAnswerSchema, checkResultSchema, createCheckRequestSchema } from '@/validations/checkRequestValidation'

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
// Book rules and in-game date (GM)
router.put('/:id/rules', validateRequest(partyRulesSchema), updatePartyRules)
router.post('/:id/calendar', validateRequest(calendarActionSchema), updatePartyCalendar)
router.post('/:id/members/:charId/:answer', answerRequest)
router.patch('/:id/members/:charId', validateRequest(memberVisibilitySchema), setVisibility)
router.delete('/:id/members/:charId', removeMember)
router.get('/:id/heroes/:charId/sheet', getPartySheet)
// Shared fight and battle board
// GM check requests (user request, Nov 2026)
router.get('/:id/check-requests', listCheckRequests)
router.post('/:id/check-requests', validateRequest(createCheckRequestSchema), createCheckRequest)
router.post('/:id/check-requests/:requestId/result', validateRequest(checkResultSchema), answerCheckRequest)
router.post('/:id/check-requests/:requestId/decline', validateRequest(checkAnswerSchema), declineCheckRequest)
router.post('/:id/check-requests/:requestId/close', closeCheckRequest)

router.get('/:id/encounter', getEncounter)
router.post('/:id/encounter', validateRequest(startEncounterSchema), startEncounter)
router.post('/:id/encounter/end', endEncounter)
router.post('/:id/encounter/turn', validateRequest(turnSchema), changeTurn)
router.post('/:id/encounter/end-turn', endTurn)
router.post('/:id/encounter/allies', validateRequest(allySchema), addAlly)
router.delete('/:id/encounter/allies/:combatantId', removeAlly)
router.post('/:id/encounter/combatants/:combatantId/actions', validateRequest(actionSchema), spendAction)
router.put('/:id/encounter/combatants/:combatantId/panel', validateRequest(panelSchema), updatePanel)
router.put('/:id/encounter/obstacles', validateRequest(obstaclesSchema), setObstacles)
router.put('/:id/encounter/board', validateRequest(boardSchema), resizeBoard)
router.post('/:id/encounter/npcs', validateRequest(addNpcsSchema), addNpcs)
router.post('/:id/encounter/npc-initiative', validateRequest(npcInitiativeSchema), rollNpcInitiative)
router.patch('/:id/encounter/combatants/:combatantId', validateRequest(updateCombatantSchema), updateCombatant)
router.post('/:id/encounter/combatants/:combatantId/damage', validateRequest(damageSchema), damageCombatant)
router.put('/:id/encounter/combatants/:combatantId/position', validateRequest(positionSchema), moveCombatant)
router.delete('/:id/encounter/combatants/:combatantId', removeCombatant)
router.post('/:id/encounter/attacks', validateRequest(attackSchema), submitAttack)
router.post('/:id/encounter/attacks/:attackId/defense', validateRequest(defenseSchema), resolveDefense)
router.delete('/:id/encounter/attacks/:attackId', cancelAttack)
router.post('/:id/encounter/attacks/:attackId/damage', validateRequest(damageRollSchema), rollAttackDamage)
router.post('/:id/encounter/passing', validateRequest(passingGrantSchema), grantPassing)

// Prepared fights (GM): list, create, delete, unlock; editing uses the same handlers under /encounters/:encounterId
router.get('/:id/encounters', listPrepared)
router.post('/:id/encounters', validateRequest(preparedSchema), createPrepared)
router.delete('/:id/encounters/:encounterId', deletePrepared)
router.post('/:id/encounters/:encounterId/activate', activatePrepared)
const prepared = '/:id/encounters/:encounterId/edit'
router.get(prepared, getPreparedEncounter)
router.put(`${prepared}/board`, validateRequest(boardSchema), resizeBoard)
router.put(`${prepared}/obstacles`, validateRequest(obstaclesSchema), setObstacles)
router.post(`${prepared}/npcs`, validateRequest(addNpcsSchema), addNpcs)
router.post(`${prepared}/npc-initiative`, validateRequest(npcInitiativeSchema), rollNpcInitiative)
router.patch(`${prepared}/combatants/:combatantId`, validateRequest(updateCombatantSchema), updateCombatant)
router.put(`${prepared}/combatants/:combatantId/position`, validateRequest(positionSchema), moveCombatant)
router.delete(`${prepared}/combatants/:combatantId`, removeCombatant)

export default router
