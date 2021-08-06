import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleComponent } from './sample.component';

describe('SampleComponent', () => {
  let component: SampleComponent;
  let fixture: ComponentFixture<SampleComponent>;

  // set up the module used for the test here. i.e. add any module imports for primeng components, add any services that are injected, etc...
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SampleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SampleComponent);
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
});
