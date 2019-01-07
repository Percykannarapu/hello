import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableFilterNumericComponent } from './table-filter-numeric.component';

describe('TableFilterNumericComponent', () => {
  let component: TableFilterNumericComponent;
  let fixture: ComponentFixture<TableFilterNumericComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableFilterNumericComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableFilterNumericComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
