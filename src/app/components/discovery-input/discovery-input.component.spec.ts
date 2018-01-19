import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoveryInputComponent } from './discovery-input.component';

describe('DiscoveryInputComponent', () => {
  let component: DiscoveryInputComponent;
  let fixture: ComponentFixture<DiscoveryInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscoveryInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscoveryInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
