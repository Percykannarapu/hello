import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofootprintComponent } from './geofootprint.component';

describe('GeofootprintComponent', () => {
  let component: GeofootprintComponent;
  let fixture: ComponentFixture<GeofootprintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeofootprintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeofootprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
