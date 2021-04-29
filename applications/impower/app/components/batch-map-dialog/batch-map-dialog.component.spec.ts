import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BatchMapDialogComponent } from './batch-map-dialog.component';

describe('BatchMapDialogComponent', () => {
  let component: BatchMapDialogComponent;
  let fixture: ComponentFixture<BatchMapDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BatchMapDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchMapDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
