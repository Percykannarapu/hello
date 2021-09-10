import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualGeoDialogComponent } from './manual-geo-dialog.component';

describe('ManualGeoDialogComponent', () => {
  let component: ManualGeoDialogComponent;
  let fixture: ComponentFixture<ManualGeoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualGeoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualGeoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
