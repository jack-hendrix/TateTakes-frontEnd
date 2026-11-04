import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import {
  AuthServiceStub,
  createAuthServiceStub,
  createUiSpies,
  keydown,
  provideActivatedRoute,
  UiSpies,
} from '../../../testing/component-testing';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let auth: AuthServiceStub;
  let ui: UiSpies;
  let router: Router;

  function setup(signedIn = false, path = '') {
    auth = createAuthServiceStub(signedIn);
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        provideActivatedRoute(path),
        auth.provider,
        ...ui.providers,
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
  }

  function links(): string[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.nav-link'),
    ).map((el) => el.textContent?.trim() ?? '');
  }

  function link(text: string): HTMLElement {
    const match = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a.nav-link'),
    ).find((el) => el.textContent?.trim() === text);
    if (!match) throw new Error(`No link "${text}"`);
    return match as HTMLElement;
  }

  it('shows Subscribe and Log In when signed out', () => {
    setup();
    expect(links()).toEqual([
      'Send Death Threats to Author',
      'Subscribe',
      'Log In',
    ]);
  });

  it('shows Admin and Log Out when signed in', () => {
    setup(true);
    expect(links()).toContain('Admin');
    expect(links()).toContain('Log Out');
    expect(links()).not.toContain('Log In');
  });

  it('reacts to auth changes', () => {
    setup();
    auth.authStatus.next({ uid: 'tate' } as never);
    fixture.detectChanges();
    expect(links()).toContain('Log Out');
  });

  it('marks the current page instead of linking to it', () => {
    setup(false, 'login');
    const current = (fixture.nativeElement as HTMLElement).querySelector(
      'span.nav-link.current',
    );
    expect(current?.textContent?.trim()).toBe('Log In');
  });

  it('navigates from each link', () => {
    setup(true);
    link('Subscribe').click();
    link('Admin').click();
    link('Send Death Threats to Author').click();
    (
      (fixture.nativeElement as HTMLElement).querySelector(
        '.logo-link',
      ) as HTMLElement
    ).click();

    expect(router.navigate).toHaveBeenCalledWith(['/subscribe']);
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    expect(router.navigate).toHaveBeenCalledWith(['/deathThreats']);
    expect(router.navigate).toHaveBeenCalledWith(['/feed']);
  });

  it('toggles the mobile menu', () => {
    setup();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      '.menu-toggle',
    ) as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.nav-left')
        ?.classList.contains('open'),
    ).toBeTrue();
  });

  it('logs out and returns to the feed', fakeAsync(() => {
    setup(true);
    auth.service.logout.and.resolveTo();

    link('Log Out').click();
    tick();

    expect(auth.service.logout).toHaveBeenCalled();
    expect(ui.spinner.hide).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/feed']);
  }));

  it('shows an error when logout fails', fakeAsync(() => {
    setup(true);
    spyOn(console, 'error');
    auth.service.logout.and.rejectWith(new Error('nope'));

    link('Log Out').click();
    tick();

    expect(ui.toastr.error).toHaveBeenCalled();
    expect(ui.spinner.hide).toHaveBeenCalled();
  }));

  it('activates a link with Enter', () => {
    setup();
    keydown(link('Subscribe'), 'Enter');
    expect(router.navigate).toHaveBeenCalledWith(['/subscribe']);
  });

  it('does not activate a link when tabbing past it', () => {
    setup(true);
    auth.service.logout.and.resolveTo();

    keydown(link('Log Out'), 'Tab');

    expect(auth.service.logout).not.toHaveBeenCalled();
  });
});
