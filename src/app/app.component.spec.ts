import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { FeedComponent } from './components/feed/feed.component';

describe('AppComponent', () => {
  it('renders the router outlet and spinner', () => {
    spyOn(console, 'log');
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).not.toBeNull();
    expect(el.querySelector('ngx-spinner')).not.toBeNull();
  });
});

describe('routes', () => {
  it('redirects the root to the feed', () => {
    expect(routes.find((r) => r.path === '')?.redirectTo).toBe('/feed');
  });

  it('guards the admin page', () => {
    const admin = routes.find((r) => r.path === 'admin');
    expect(admin?.canActivate?.length).toBe(1);
    expect(admin?.data?.['authGuardPipe']).toBeDefined();
  });

  it('falls back to the feed for unknown paths', () => {
    expect(routes.find((r) => r.path === '**')?.component).toBe(FeedComponent);
  });

  it('lazy loads every page except the feed', async () => {
    const lazy = routes.filter((r) => r.loadComponent);
    expect(lazy.map((r) => r.path)).toEqual([
      'login',
      'deathThreats',
      'subscribe',
      'post/:postId/:index',
      'admin',
    ]);
    for (const route of lazy) {
      expect(await route.loadComponent!()).toBeDefined();
    }
  });
});
