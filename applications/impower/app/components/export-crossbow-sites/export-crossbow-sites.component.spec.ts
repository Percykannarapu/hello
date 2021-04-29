import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExportCrossbowSitesComponent } from './export-crossbow-sites.component';

describe('ExportCrossbowSitesComponent', () => {
  let component: ExportCrossbowSitesComponent;
  let fixture: ComponentFixture<ExportCrossbowSitesComponent>;

  beforeEach(waitForAsync(() => {
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
