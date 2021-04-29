import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrintViewComponent } from './print-view.component';

describe('PrintViewComponent', () => {
  let component: PrintViewComponent;
  let fixture: ComponentFixture<PrintViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrintViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
