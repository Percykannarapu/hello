import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EsriLayerSelectComponent } from './esri-layer-select.component';

describe('EsriLayerComponent', () => {
  let component: EsriLayerSelectComponent;
  let fixture: ComponentFixture<EsriLayerSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EsriLayerSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EsriLayerSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
