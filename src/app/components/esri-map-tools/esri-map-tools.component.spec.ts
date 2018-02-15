import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EsriMapToolsComponent } from './esri-map-tools.component';

describe('EsriLayerComponent', () => {
  let component: EsriMapToolsComponent;
  let fixture: ComponentFixture<EsriMapToolsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EsriMapToolsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EsriMapToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
