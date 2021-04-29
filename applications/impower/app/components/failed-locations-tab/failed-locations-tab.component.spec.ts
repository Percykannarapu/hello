import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FailedLocationsTabComponent } from './failed-locations-tab.component';

describe('FailedLocationsTabComponent', () => {
  let component: FailedLocationsTabComponent;
  let fixture: ComponentFixture<FailedLocationsTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FailedLocationsTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FailedLocationsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
