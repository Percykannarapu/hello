import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GeofootprintGeoListComponent } from './geofootprint-geo-list.component';

describe('GeofootprintGeoListComponent', () => {
  let component: GeofootprintGeoListComponent;
  let fixture: ComponentFixture<GeofootprintGeoListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GeofootprintGeoListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeofootprintGeoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
