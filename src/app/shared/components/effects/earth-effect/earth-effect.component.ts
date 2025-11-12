import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    initEarthEffect?: (canvas: HTMLCanvasElement | string) => (() => void) | void;
    __earthEffectPromise?: Promise<void>;
  }
}

@Component({
  selector: 'app-earth-effect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas
      #earthCanvas
      class="earth-effect-canvas"
      [attr.id]="canvasId"
    ></canvas>
  `,
})
export class EarthEffectComponent implements AfterViewInit, OnDestroy {
  @Input() canvasId = 'earth';
  @ViewChild('earthCanvas', { static: true }) private earthCanvas!: ElementRef<HTMLCanvasElement>;

  private disposeEffect?: () => void;

  async ngAfterViewInit(): Promise<void> {
    await this.ensureLibraries();
    const canvas = this.earthCanvas.nativeElement;
    const result = window.initEarthEffect?.(canvas);
    if (typeof result === 'function') {
      this.disposeEffect = result;
    }
  }

  ngOnDestroy(): void {
    if (this.disposeEffect) {
      this.disposeEffect();
      this.disposeEffect = undefined;
    }
  }

  private ensureLibraries(): Promise<void> {
    const globalRef = window as Window & {
      __earthEffectPromise?: Promise<void>;
      THREE?: unknown;
    };

    if (globalRef.initEarthEffect && globalRef.THREE) {
      return Promise.resolve();
    }

    if (globalRef.__earthEffectPromise) {
      return globalRef.__earthEffectPromise;
    }

    globalRef.__earthEffectPromise = new Promise<void>((resolve, reject) => {
      const ensureEffect = () => {
        if (globalRef.initEarthEffect) {
          resolve();
          return;
        }

        const effectScript = document.createElement('script');
        effectScript.src = 'assets/effects/earth-effect.js';
        effectScript.async = true;
        effectScript.onload = () => resolve();
        effectScript.onerror = (err) => reject(err);
        document.body.appendChild(effectScript);
      };

      if (globalRef.THREE) {
        ensureEffect();
        return;
      }

      const threeScript = document.createElement('script');
      threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.min.js';
      threeScript.async = true;
      threeScript.onload = () => ensureEffect();
      threeScript.onerror = (err) => reject(err);
      document.body.appendChild(threeScript);
    });

    return globalRef.__earthEffectPromise;
  }
}


