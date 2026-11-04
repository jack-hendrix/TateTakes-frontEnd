import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login.component';
import {
  AuthServiceStub,
  createAuthServiceStub,
  createUiSpies,
  provideActivatedRoute,
  UiSpies,
} from '../../../testing/component-testing';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: AuthServiceStub;
  let ui: UiSpies;
  let router: Router;

  function setup(signedIn = false) {
    auth = createAuthServiceStub(signedIn);
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideActivatedRoute('login'),
        auth.provider,
        ...ui.providers,
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function submitButton(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      'button[type=submit]',
    ) as HTMLButtonElement;
  }

  it('requires a valid email and a password of at least 6 characters', () => {
    setup();
    expect(submitButton().disabled).toBeTrue();

    component.loginForm.setValue({ email: 'not-an-email', password: 'secret' });
    fixture.detectChanges();
    expect(submitButton().disabled).toBeTrue();

    component.loginForm.setValue({
      email: 'tate@example.com',
      password: '123',
    });
    fixture.detectChanges();
    expect(submitButton().disabled).toBeTrue();

    component.loginForm.setValue({
      email: 'tate@example.com',
      password: 'secret',
    });
    fixture.detectChanges();
    expect(submitButton().disabled).toBeFalse();
  });

  it('logs in and goes to the admin page', fakeAsync(() => {
    setup();
    auth.service.login.and.resolveTo({} as never);
    component.loginForm.setValue({
      email: 'tate@example.com',
      password: 'secret',
    });

    component.login();
    tick();

    expect(auth.service.login).toHaveBeenCalledWith(
      'tate@example.com',
      'secret',
    );
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    expect(ui.spinner.hide).toHaveBeenCalled();
  }));

  it('shows an error when login fails', fakeAsync(() => {
    setup();
    spyOn(console, 'error');
    auth.service.login.and.rejectWith(new Error('bad password'));
    component.loginForm.setValue({
      email: 'tate@example.com',
      password: 'secret',
    });

    component.login();
    tick();

    expect(ui.toastr.error).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(ui.spinner.hide).toHaveBeenCalled();
  }));

  it('refuses to log in again when already signed in', () => {
    setup(true);

    component.login();

    expect(auth.service.login).not.toHaveBeenCalled();
    expect(ui.toastr.error).toHaveBeenCalledWith(
      'You are already logged in',
      'Something went wrong',
    );
  });

  it('does not leave the spinner running when the form is invalid', () => {
    setup();

    component.login();

    expect(auth.service.login).not.toHaveBeenCalled();
    expect(ui.spinner.hide.calls.count()).toBe(ui.spinner.show.calls.count());
  });
});
