import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BatchMapComponent } from './batch-map.component';

describe('PrintMapComponent', () => {
  let component: BatchMapComponent;
  let fixture: ComponentFixture<BatchMapComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BatchMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
