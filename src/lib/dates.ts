// Small helpers that read the current time. Kept out of component bodies so
// the "no impure calls during render" lint rule doesn't flag Server
// Components that need to know whether an event is in the past — these are
// dynamic routes (they read cookies()) and are expected to re-run per request.
export function isPastIso(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function nowMs(): number {
  return Date.now();
}
