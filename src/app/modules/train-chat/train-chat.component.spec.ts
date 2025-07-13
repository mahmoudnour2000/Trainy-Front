import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainChatComponent } from './train-chat.component';

describe('TrainChatComponent', () => {
  let component: TrainChatComponent;
  let fixture: ComponentFixture<TrainChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
