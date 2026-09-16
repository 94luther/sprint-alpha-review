// Small, self-contained helpers for demo/video capture tooling. Not part of
// the real product surface: lets an automated screenshot script deep-link
// into a signed-in state (?as=customer|courier|ops) or a pre-seeded cart
// (?drawer=1, ?seed=m1) without touching normal user flows.

const DEMO_CREDENTIALS: Record<string, { phone: string; pin: string }> = {
  customer: { phone: '71111111', pin: '1234' },
  courier: { phone: '72222222', pin: '1234' },
  ops: { phone: '73333333', pin: '1234' }
}

export function demoCredentialsFor(as: string | null): { phone: string; pin: string } | null {
  if (!as) return null
  return DEMO_CREDENTIALS[as] ?? null
}
