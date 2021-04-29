import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BatchMapDashboardComponent } from './batch-map-dashboard.component';

describe('BatchMapDashboardComponent', () => {
  let component: BatchMapDashboardComponent;
  let fixture: ComponentFixture<BatchMapDashboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BatchMapDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchMapDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
