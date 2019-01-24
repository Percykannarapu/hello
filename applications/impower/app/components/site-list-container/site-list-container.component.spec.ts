import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteListContainerComponent } from './site-list-container.component';

describe('SiteListContainerComponent', () => {
  let component: SiteListContainerComponent;
  let fixture: ComponentFixture<SiteListContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SiteListContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiteListContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
