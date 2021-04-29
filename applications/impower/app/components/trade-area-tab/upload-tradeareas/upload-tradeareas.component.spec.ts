import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UploadTradeAreasComponent } from './upload-tradeareas.component';

describe('UploadTradeAreasComponent', () => {
  let component: UploadTradeAreasComponent;
  let fixture: ComponentFixture<UploadTradeAreasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadTradeAreasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadTradeAreasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
