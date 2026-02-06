/**
 * Named BalancedBot parameter profiles for strategy matrix experiments.
 * Profiles tune behavior only; engine rules remain unchanged.
 */

const botProfiles = {
  default: {},
  s0_default: {},
  s1_research_push: {
    researchBudgetRatio: 0.3,
    minCreditsBuffer: 40,
    researchDonationCooldownTicks: 260,
    maxRPReserveForDonationInExperiments: 10,
    maxExperimentsPerTick: 4,
    maxExperimentsPerTickWhenStalled: 8,
    researchStallTicks: 1800,
  },
  s2_research_hard_push: {
    researchBudgetRatio: 0.36,
    minCreditsBuffer: 35,
    researchDonationCooldownTicks: 220,
    maxRPReserveForDonationInExperiments: 8,
    maxExperimentsPerTick: 5,
    maxExperimentsPerTickWhenStalled: 9,
    researchStallTicks: 1400,
    explorationCheckCooldownWhenBehind: 220,
    explorationExpansionCooldownWhenBehind: 1800,
    nodeUnlockBufferMultiplierWhenBehind: 8,
    disableMapExpansionWhenBehind: true,
    mapExpansionBufferMultiplier: 4,
  },
  s3_hybrid_progression: {
    researchBudgetRatio: 0.27,
    minCreditsBuffer: 45,
    buildCooldownTicks: 80,
    maxUndeployedMachines: 12,
    maxUndeployedGenerators: 4,
    maxExperimentsPerTick: 4,
    maxExperimentsPerTickWhenStalled: 7,
    researchDonationCooldownTicks: 300,
    maxRPReserveForDonationInExperiments: 12,
    researchStallTicks: 1800,
    explorationCheckCooldownWhenBehind: 120,
    explorationExpansionCooldownWhenBehind: 800,
    nodeUnlockBufferMultiplierWhenBehind: 3,
    disableMapExpansionWhenBehind: false,
    mapExpansionBufferMultiplier: 2,
  },
  s4_cashflow_rotation: {
    researchBudgetRatio: 0.18,
    minCreditsBuffer: 80,
    buildCooldownTicks: 70,
    maxUndeployedMachines: 14,
    maxUndeployedGenerators: 5,
    maxExperimentsPerTick: 2,
    maxExperimentsPerTickWhenStalled: 4,
    researchDonationCooldownTicks: 650,
    maxRPReserveForDonationInExperiments: 18,
    explorationCheckCooldownWhenBehind: 80,
    explorationExpansionCooldownWhenBehind: 500,
    nodeUnlockBufferMultiplierWhenBehind: 2,
    disableMapExpansionWhenBehind: false,
    mapExpansionBufferMultiplier: 1.8,
  },
};

export function getBotProfiles() {
  return Object.keys(botProfiles);
}

export function resolveBotProfile(name = 'default') {
  return botProfiles[name] ? name : null;
}

export function getBotProfileParams(name = 'default') {
  const resolved = resolveBotProfile(name);
  if (!resolved) return null;
  return {
    ...botProfiles[resolved],
  };
}
