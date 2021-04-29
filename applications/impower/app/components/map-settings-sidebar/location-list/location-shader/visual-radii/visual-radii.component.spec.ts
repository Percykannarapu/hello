import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VisualRadiiComponent } from './visual-radii.component';

describe('VisualRadiiComponent', () => {
  let component: VisualRadiiComponent;
  let fixture: ComponentFixture<VisualRadiiComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VisualRadiiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualRadiiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
