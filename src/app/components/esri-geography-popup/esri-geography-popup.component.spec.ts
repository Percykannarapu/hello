import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EsriGeographyPopupComponent } from './esri-geography-popup.component';

describe('EsriGeometryPopupComponent', () => {
  let component: EsriGeographyPopupComponent;
  let fixture: ComponentFixture<EsriGeographyPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EsriGeographyPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EsriGeographyPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
