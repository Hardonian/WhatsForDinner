export function useState(init) {
    return [init, () => { }];
}
export function useEffect() { }
export function useCallback(fn) {
    return fn;
}
export default { useState, useEffect, useCallback };
