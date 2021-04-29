import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UploadLocationsComponent } from './upload-locations.component';

describe('UploadLocationsComponent', () => {
  let component: UploadLocationsComponent;
  let fixture: ComponentFixture<UploadLocationsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadLocationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
