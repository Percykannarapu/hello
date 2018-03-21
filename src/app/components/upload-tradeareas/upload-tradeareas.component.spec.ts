import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadTradeAreasComponent } from './upload-trade-areas.component';

describe('UploadTradeAreasComponent', () => {
  let component: UploadTradeAreasComponent;
  let fixture: ComponentFixture<UploadTradeAreasComponent>;

  beforeEach(async(() => {
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
