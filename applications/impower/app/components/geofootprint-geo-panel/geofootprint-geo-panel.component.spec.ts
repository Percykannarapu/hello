import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GeofootprintGeoPanelComponent } from './geofootprint-geo-panel.component';

describe('GeofootprintGeoPanelComponent', () => {
  let component: GeofootprintGeoPanelComponent;
  let fixture: ComponentFixture<GeofootprintGeoPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GeofootprintGeoPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeofootprintGeoPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
