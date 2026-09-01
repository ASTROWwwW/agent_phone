export interface AgentNavbarCollapseState {
  compactTitleOpacity: number
  extendedTitleOpacity: number
  offset: number
}

export function getAgentNavbarCollapseState(
  scrollTop: number,
  titleHeight: number,
  collapseLayout = true,
): AgentNavbarCollapseState {
  const safeScrollTop = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0
  const safeTitleHeight = Number.isFinite(titleHeight)
    ? Math.max(0, titleHeight)
    : 0
  const progress =
    safeTitleHeight > 0 ? Math.min(1, safeScrollTop / safeTitleHeight) : 0

  return {
    compactTitleOpacity: Math.max(0, -0.5 + progress * 1.5),
    extendedTitleOpacity: Math.max(0, 1 - progress * 2),
    offset: collapseLayout ? progress * safeTitleHeight : 0,
  }
}
