import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MultiselectInputComponent } from './multiselect-input.component';

describe('MultiselectInputComponent', () => {
  let component: MultiselectInputComponent;
  let fixture: ComponentFixture<MultiselectInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MultiselectInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiselectInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
