import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;

  // set up the module used for the test here. i.e. add any module imports for primeng components, add any services that are injected, etc...
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ButtonModule, InputTextModule, FormsModule ],
      declarations: [ SearchInputComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  });

  // the beginning of the actual tests. This first test only ensures that an instance gets created.
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit resultChanged when input value changes', fakeAsync(() => {
    const userValue = 'foo';
    const input: HTMLInputElement = fixture.nativeElement.querySelector('div div input');

    spyOn(component.resultChanged, 'emit');

    input.value = userValue;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(component.debounceValue);

    expect(component.resultChanged.emit).toHaveBeenCalledWith(userValue);
  }));

  it('should clear the input value after reset', waitForAsync(() => {
    const userValue = 'foo';
    const input: HTMLInputElement = fixture.nativeElement.querySelector('div div input');
    input.value = userValue;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    component.reset();
    fixture.whenStable().then(() => {
      expect(input.value).not.toBe(userValue);
    });
  }));

  it('should return the input value from getValue', waitForAsync(() => {
    const userValue = 'foo';
    const input: HTMLInputElement = fixture.nativeElement.querySelector('div div input');
    input.value = userValue;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.getValue()).toBe(userValue);
    });
  }));
});
