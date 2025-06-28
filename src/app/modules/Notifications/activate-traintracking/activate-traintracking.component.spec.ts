import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivateTraintrackingComponent } from './activate-traintracking.component';

describe('ActivateTraintrackingComponent', () => {
  let component: ActivateTraintrackingComponent;
  let fixture: ComponentFixture<ActivateTraintrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivateTraintrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivateTraintrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
