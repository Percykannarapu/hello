import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketGeosComponent } from './market-geos.component';

describe('MarketGeosComponent', () => {
  let component: MarketGeosComponent;
  let fixture: ComponentFixture<MarketGeosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarketGeosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketGeosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
