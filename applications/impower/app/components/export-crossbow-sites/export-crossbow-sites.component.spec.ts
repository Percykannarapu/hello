import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportCrossbowSitesComponent } from './export-crossbow-sites.component';

describe('ExportCrossbowSitesComponent', () => {
  let component: ExportCrossbowSitesComponent;
  let fixture: ComponentFixture<ExportCrossbowSitesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExportCrossbowSitesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportCrossbowSitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
