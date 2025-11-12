import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotarySimulationComponent } from './notary-simulation.component';

describe('NotarySimulationComponent', () => {
  let component: NotarySimulationComponent;
  let fixture: ComponentFixture<NotarySimulationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotarySimulationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotarySimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
