import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShadingConfigComponent } from './shading-config.component';

describe('ShadingConfigComponent', () => {
  let component: ShadingConfigComponent;
  let fixture: ComponentFixture<ShadingConfigComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ShadingConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShadingConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
