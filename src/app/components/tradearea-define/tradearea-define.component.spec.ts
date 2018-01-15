import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeareaDefineComponent } from './tradearea-define.component';

describe('TradeareaDefineComponent', () => {
  let component: TradeareaDefineComponent;
  let fixture: ComponentFixture<TradeareaDefineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TradeareaDefineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeareaDefineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
