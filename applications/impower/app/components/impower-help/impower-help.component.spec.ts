import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpowerHelpComponent } from './impower-help.component';

describe('ImpowerHelpComponent', () => {
  let component: ImpowerHelpComponent;
  let fixture: ComponentFixture<ImpowerHelpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImpowerHelpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpowerHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});