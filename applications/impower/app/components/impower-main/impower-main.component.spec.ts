import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpowerMainComponent } from './impower-main.component';

describe('ImpowerMainComponent', () => {
  let component: ImpowerMainComponent;
  let fixture: ComponentFixture<ImpowerMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImpowerMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpowerMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
