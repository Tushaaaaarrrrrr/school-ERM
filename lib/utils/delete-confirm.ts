export function confirmDeleteTwice(itemName: string) {
  if (typeof window === 'undefined') return false;
  if (!window.confirm(`Delete ${itemName}? This action may affect school records.`)) return false;
  return window.confirm(`Final confirmation: delete ${itemName}?`);
}
