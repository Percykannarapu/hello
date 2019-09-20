import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchMapFooterComponent } from './batch-map-footer.component';

describe('BatchMapFooterComponent', () => {
  let component: BatchMapFooterComponent;
  let fixture: ComponentFixture<BatchMapFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BatchMapFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchMapFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
