import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeAreaDefineComponent } from './trade-area-define.component';

describe('TradeAreaDefineComponent', () => {
  let component: TradeAreaDefineComponent;
  let fixture: ComponentFixture<TradeAreaDefineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TradeAreaDefineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeAreaDefineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
