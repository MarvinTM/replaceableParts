import { describe, it, expect } from 'vitest';
import { calculateUsageRatio, getEnergyAlertLevel, getUsageColor } from '../../components/common/FloatingHUD';

describe('FloatingHUD energy utilization helpers', () => {
  it('calculates ratio from consumed and produced energy', () => {
    expect(calculateUsageRatio(20, 100)).toBe(0.2);
  });

  it('treats zero production with active consumption as overload', () => {
    expect(calculateUsageRatio(5, 0)).toBe(Infinity);
  });

  it('maps low usage to success color', () => {
    expect(getUsageColor(calculateUsageRatio(40, 100))).toBe('success.light');
    expect(getUsageColor(calculateUsageRatio(74, 100))).toBe('success.light');
  });

  it('maps near-limit usage to warning color', () => {
    expect(getUsageColor(calculateUsageRatio(75, 100))).toBe('warning.light');
    expect(getUsageColor(calculateUsageRatio(90, 100))).toBe('warning.light');
    expect(getUsageColor(calculateUsageRatio(100, 100))).toBe('warning.light');
  });

  it('maps over-limit usage to error color', () => {
    expect(getUsageColor(calculateUsageRatio(101, 100))).toBe('error.light');
    expect(getUsageColor(calculateUsageRatio(1, 0))).toBe('error.light');
  });

  it('maps ratio bands to alert levels used for icon effects', () => {
    expect(getEnergyAlertLevel(calculateUsageRatio(70, 100))).toBe('normal');
    expect(getEnergyAlertLevel(calculateUsageRatio(75, 100))).toBe('warning');
    expect(getEnergyAlertLevel(calculateUsageRatio(100, 100))).toBe('warning');
    expect(getEnergyAlertLevel(calculateUsageRatio(101, 100))).toBe('error');
  });
});
