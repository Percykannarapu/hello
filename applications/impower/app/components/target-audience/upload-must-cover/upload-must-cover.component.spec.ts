import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadMustCoverComponent } from './upload-must-cover.component';

describe('UploadMustCoverComponent', () => {
  let component: UploadMustCoverComponent;
  let fixture: ComponentFixture<UploadMustCoverComponent>;

  beforeEach(async(() => {
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
