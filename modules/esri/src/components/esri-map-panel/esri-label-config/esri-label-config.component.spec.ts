import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EsriLabelConfigComponent } from './esri-label-config.component';

describe('EsriLabelConfigComponent', () => {
  let component: EsriLabelConfigComponent;
  let fixture: ComponentFixture<EsriLabelConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EsriLabelConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EsriLabelConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
