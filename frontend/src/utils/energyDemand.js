/**
 * Calculate requested machine energy consumption for HUD display.
 *
 * This includes machines that are currently blocked due to power shortage,
 * as long as they are enabled and have an active workload (recipe or
 * research-facility baseline demand).
 */
export function calculateRequestedEnergyConsumption({
  machines = [],
  machineConfigs = [],
}) {
  const machineConfigById = new Map(
    machineConfigs.map(config => [config.id, config])
  );

  let requestedConsumption = 0;

  for (const machine of machines) {
    if (!machine?.enabled) continue;

    const machineConfig = machineConfigById.get(machine.type);
    if (!machineConfig) continue;

    const isResearchFacility = Boolean(machineConfig.isResearchFacility);
    if (!machine.recipeId && !isResearchFacility) continue;

    const energyConsumption = Number(machineConfig.energyConsumption);
    if (!Number.isFinite(energyConsumption) || energyConsumption <= 0) continue;

    requestedConsumption += energyConsumption;
  }

  return requestedConsumption;
}
