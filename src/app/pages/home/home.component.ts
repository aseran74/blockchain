import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlanetEffectComponent } from '../../shared/components/effects/planet-effect/planet-effect.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PlanetEffectComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly numberFormatter = new Intl.NumberFormat('es-ES');
  private readonly decimalFormatter = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  private readonly technologyCapacity = {
    visa: 1700,
    ppov: 13_990,
    solana: 1504,
    polygon: 48,
  } as const;

  readonly worldPopulation = signal(7000); // millones
  readonly activePercent = signal(70);
  readonly txPerDay = signal(4);
  readonly peakMultiplier = signal(3);

  readonly activeUsers = computed(() =>
    (this.worldPopulation() * this.activePercent()) / 100
  );

  readonly dailyTransactions = computed(() =>
    this.activeUsers() * this.txPerDay() * 1_000_000
  );

  readonly avgTps = computed(() =>
    Math.round(this.dailyTransactions() / 86_400)
  );

  readonly peakTps = computed(() =>
    Math.round(this.avgTps() * this.peakMultiplier())
  );

  readonly highlights = computed(() => {
    const peak = this.peakTps();
    const avg = this.avgTps();
    const daily = this.dailyTransactions();

    const safeDiv = (value: number, divisor: number) =>
      divisor > 0 ? Math.ceil(value / divisor) : 0;

    return {
      activeLabel: `${this.activePercent()}% (${this.formatNumber(this.activeUsers())} M)`,
      dailyTxBillions: this.formatBillions(daily / 1_000_000_000),
      avgTps: this.formatNumber(avg),
      peakTps: this.formatNumber(peak),
      ppovNeeded: this.formatNumber(safeDiv(peak, this.technologyCapacity.ppov)),
      visaNeeded: this.formatNumber(safeDiv(peak, this.technologyCapacity.visa)),
      solanaNeeded: this.formatNumber(safeDiv(peak, this.technologyCapacity.solana)),
      polygonNeeded: this.formatNumber(safeDiv(peak, this.technologyCapacity.polygon)),
    } as const;
  });

  ngOnInit(): void {
    document.body.classList.add('landing-page');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('landing-page');
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

  private formatNumber(value: number) {
    return this.numberFormatter.format(value);
  }

  private formatBillions(value: number) {
    return this.decimalFormatter.format(value);
  }
}


