import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SendSitesDigitalComponent } from './send-sites-digital.component';

describe('SendSitesDigitalComponent', () => {
  let component: SendSitesDigitalComponent;
  let fixture: ComponentFixture<SendSitesDigitalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendSitesDigitalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendSitesDigitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
