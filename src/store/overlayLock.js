/**
 * Overlays that must freeze the 3D character.
 * Used so closing one modal does not unlock WASD while another is still open.
 */
export function isMovementLocked(state) {
  return Boolean(
    state.coinPopup ||
    state.pendingEnex ||
    state.tvVideoUrl ||
    state.networkGameActive ||
    state.hackerGameActive ||
    state.marketingGameActive ||
    state.isDialogueActive ||
    state.isSelectorOpen,
  );
}
