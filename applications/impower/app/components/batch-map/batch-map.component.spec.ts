import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchMapComponent } from './batch-map.component';

describe('PrintMapComponent', () => {
  let component: BatchMapComponent;
  let fixture: ComponentFixture<BatchMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BatchMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
