import type { ICheckRequestDocument } from '@/models/checkRequest.model'
import { visibleTargets, type CheckTargetShape } from '@/utils/checkRequestRules'

export const targetShapes = (request: ICheckRequestDocument): CheckTargetShape[] => request.targets.map((target) => ({
   charId: String(target.charId), userId: String(target.userId), state: target.state, result: target.result ?? null,
}))

// Shaped per viewer: hidden results only for the GM and the hero's own player; no user ids
export function checkRequestView(request: ICheckRequestDocument, viewerId: string, isGm: boolean, names: Map<string, string>) {
   return {
      id: String(request._id),
      kind: request.kind,
      key: request.key,
      modifier: request.modifier,
      hidden: request.hidden,
      note: request.note,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      targets: visibleTargets(targetShapes(request), viewerId, isGm, request.hidden)
         .map((target) => ({ ...target, name: names.get(target.charId) ?? '?' })),
   }
}
