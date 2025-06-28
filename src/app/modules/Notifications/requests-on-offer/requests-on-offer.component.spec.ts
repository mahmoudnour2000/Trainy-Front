import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestsOnOfferComponent } from './requests-on-offer.component';

describe('RequestsOnOfferComponent', () => {
  let component: RequestsOnOfferComponent;
  let fixture: ComponentFixture<RequestsOnOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestsOnOfferComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestsOnOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
