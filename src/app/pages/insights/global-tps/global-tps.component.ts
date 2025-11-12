import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

type ScenarioKey = 'conservative' | 'moderate' | 'intensive' | 'hyperdigital';

type ScenarioConfig = {
  name: string;
  active: number;
  txPerDay: number;
  peak: number;
};

type TechnologyInfo = {
  name: string;
  real: number;
  theoretical: number;
  color: string;
};

@Component({
  selector: 'app-global-tps',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-tps.component.html',
})
export class GlobalTpsComponent {
  private readonly numberFormatter = new Intl.NumberFormat('es-ES');
  private readonly decimalFormatter = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  readonly scenarios: Record<ScenarioKey, ScenarioConfig> = {
    conservative: { name: 'Conservador', active: 50, txPerDay: 2, peak: 3 },
    moderate: { name: 'Moderado', active: 70, txPerDay: 4, peak: 3 },
    intensive: { name: 'Intensivo', active: 100, txPerDay: 10, peak: 5 },
    hyperdigital: { name: 'Híper-Digital', active: 100, txPerDay: 15, peak: 10 },
  };

  readonly scenarioEntries = Object.entries(this.scenarios) as Array<[
    ScenarioKey,
    ScenarioConfig
  ]>;

  readonly technologies: Record<string, TechnologyInfo> = {
    visa: { name: 'Visa', real: 1700, theoretical: 24000, color: 'blue' },
    ppov: { name: 'PPoV', real: 13990, theoretical: 13990, color: 'green' },
    solana: { name: 'Solana', real: 1504, theoretical: 65000, color: 'purple' },
    polygonPos: { name: 'Polygon PoS', real: 48, theoretical: 65000, color: 'rose' },
    arbitrum: { name: 'Arbitrum', real: 59, theoretical: 4000, color: 'orange' },
    base: { name: 'Base', real: 37, theoretical: 2000, color: 'indigo' },
    ethereum: { name: 'Ethereum L1', real: 23, theoretical: 62, color: 'slate' },
  };

  readonly technologyList = Object.entries(this.technologies).map(([key, info]) => ({
    key,
    ...info,
  }));

  readonly scenario = signal<ScenarioKey>('conservative');
  readonly worldPopulation = signal(7000); // en millones
  readonly activePercent = signal(this.scenarios.conservative.active);
  readonly txPerDay = signal(this.scenarios.conservative.txPerDay);
  readonly peakMultiplier = signal(this.scenarios.conservative.peak);

  readonly activeUsers = computed(() =>
    (this.worldPopulation() * this.activePercent()) / 100
  );

  readonly dailyTransactions = computed(() =>
    this.activeUsers() * this.txPerDay() * 1_000_000
  );

  readonly avgTPS = computed(() =>
    Math.round(this.dailyTransactions() / 86_400)
  );

  readonly peakTPS = computed(() =>
    Math.round(this.avgTPS() * this.peakMultiplier())
  );

  readonly results = computed(() => {
    const peak = this.peakTPS();
    const avg = this.avgTPS();
    const { visa, ppov, solana, polygonPos } = this.technologies;

    const safeDiv = (value: number, divisor: number) =>
      divisor > 0 ? Math.ceil(value / divisor) : 0;

    return {
      dailyTxBillions: this.dailyTransactions() / 1_000_000_000,
      avgTPS: avg,
      peakTPS: peak,
      visaNeeded: safeDiv(peak, visa.real),
      ppovNeeded: safeDiv(peak, ppov.real),
      solanaNeeded: safeDiv(peak, solana.real),
      polygonNeeded: safeDiv(peak, polygonPos.real),
    };
  });

  readonly l2Gap = computed(() => Math.max(1, Math.ceil(this.peakTPS() / 500)));

  loadScenario(key: ScenarioKey) {
    const config = this.scenarios[key];
    this.scenario.set(key);
    this.activePercent.set(config.active);
    this.txPerDay.set(config.txPerDay);
    this.peakMultiplier.set(config.peak);
  }

  onPopulationChange(value: string) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      this.worldPopulation.set(parsed);
    }
  }

  onActivePercentChange(value: string) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      this.activePercent.set(parsed);
    }
  }

  onTxPerDayChange(value: string) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      this.txPerDay.set(parsed);
    }
  }

  onPeakMultiplierChange(value: string) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      this.peakMultiplier.set(parsed);
    }
  }

  technologyStatus(realTps: number) {
    const peak = this.peakTPS();
    const avg = this.avgTPS();
    if (realTps >= peak) {
      return 'peak';
    }
    if (realTps >= avg) {
      return 'avg';
    }
    return 'insufficient';
  }

  technologyCoverage(realTps: number) {
    const peak = this.peakTPS();
    if (peak <= 0) {
      return 0;
    }
    return Math.min(100, (realTps / peak) * 100);
  }

  formatNumber(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    return this.numberFormatter.format(value);
  }

  formatBillions(value: number) {
    return this.decimalFormatter.format(value);
  }
}
