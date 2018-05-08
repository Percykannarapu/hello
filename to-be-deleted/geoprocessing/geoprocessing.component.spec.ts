import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoprocessingComponent } from './geoprocessing.component';

describe('GeoprocessingComponent', () => {
  let component: GeoprocessingComponent;
  let fixture: ComponentFixture<GeoprocessingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeoprocessingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeoprocessingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
