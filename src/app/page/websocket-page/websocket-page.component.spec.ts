import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsocketPageComponent } from './websocket-page.component';

describe('WebsocketPageComponent', () => {
  let component: WebsocketPageComponent;
  let fixture: ComponentFixture<WebsocketPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebsocketPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebsocketPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
