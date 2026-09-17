export function useState(init: any) {
  return [init, () => {}];
}
export function useEffect() {}
export function useCallback(fn: any) {
  return fn;
}
export default { useState, useEffect, useCallback };
