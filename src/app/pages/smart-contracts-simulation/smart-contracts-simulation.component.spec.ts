import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartContractsSimulationComponent } from './smart-contracts-simulation.component';

describe('SmartContractsSimulationComponent', () => {
  let component: SmartContractsSimulationComponent;
  let fixture: ComponentFixture<SmartContractsSimulationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartContractsSimulationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartContractsSimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
