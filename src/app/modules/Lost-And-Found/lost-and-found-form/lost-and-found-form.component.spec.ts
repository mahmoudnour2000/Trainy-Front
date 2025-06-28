/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LostAndFoundFormComponent } from './lost-and-found-form.component';

describe('LostAndFoundFormComponent', () => {
  let component: LostAndFoundFormComponent;
  let fixture: ComponentFixture<LostAndFoundFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LostAndFoundFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LostAndFoundFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
