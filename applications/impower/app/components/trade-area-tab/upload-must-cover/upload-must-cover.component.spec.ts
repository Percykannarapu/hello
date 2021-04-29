import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UploadMustCoverComponent } from './upload-must-cover.component';

describe('UploadMustCoverComponent', () => {
  let component: UploadMustCoverComponent;
  let fixture: ComponentFixture<UploadMustCoverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadMustCoverComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadMustCoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
