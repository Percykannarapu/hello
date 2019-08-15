import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { TableFilterLovComponent } from './table-filter-lov.component';
import { MultiSelectModule } from 'primeng/multiselect';

describe('TableFilterLovComponent', () => {
  let component: TableFilterLovComponent;
  let fixture: ComponentFixture<TableFilterLovComponent>;
  let de: DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MultiSelectModule],
      declarations: [ TableFilterLovComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableFilterLovComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;

    fixture.detectChanges(); // Run angular change detection before each test
  });

  it('should create', () => {
    expect(component).toBeTruthy();  // Checkout Jasmine matchers at https://jasmine.github.io/api/2.6/matchers.html
  });
});
