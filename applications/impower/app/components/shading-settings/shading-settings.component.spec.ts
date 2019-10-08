import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShadingSettingsComponent } from './shading-settings.component';

describe('ShadingSettingsComponent', () => {
  let component: ShadingSettingsComponent;
  let fixture: ComponentFixture<ShadingSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShadingSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShadingSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
