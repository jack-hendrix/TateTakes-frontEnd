import { TestBed } from '@angular/core/testing';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth, User } from 'firebase/auth';
import { AuthService } from './authentication.service';

describe('AuthService', () => {
  let auth: Auth;
  let listeners: ((user: User | null) => void)[];
  let unsubscribes: jasmine.Spy[];

  beforeEach(() => {
    // AuthService calls getAuth() on the default app. Re-initializing with
    // identical options returns the existing app, so it is shared by tests.
    const app = initializeApp({
      projectId: 'demo-tate-takes',
      apiKey: 'demo-api-key',
      appId: 'demo-app-id',
    });
    auth = getAuth(app);
    listeners = [];
    unsubscribes = [];
    spyOn(auth, 'onAuthStateChanged').and.callFake(((
      cb: (user: User | null) => void,
    ) => {
      listeners.push(cb);
      const unsubscribe = jasmine.createSpy('unsubscribe');
      unsubscribes.push(unsubscribe);
      return unsubscribe;
    }) as never);
  });

  function emit(user: User | null) {
    listeners.forEach((cb) => cb(user));
  }

  it('starts out signed out', () => {
    const service = TestBed.inject(AuthService);
    const states: (User | null)[] = [];
    service.currentAuthStatus.subscribe((s) => states.push(s));

    expect(states).toEqual([null]);
  });

  it('publishes the signed in user and sign out', () => {
    const service = TestBed.inject(AuthService);
    const states: (User | null)[] = [];
    service.currentAuthStatus.subscribe((s) => states.push(s));
    const user = { uid: 'tate' } as User;

    emit(user);
    emit(null);

    expect(states).toEqual([null, user, null]);
  });

  it('does not stack auth listeners when getAuthStatus is called again', () => {
    // HeaderComponent and LoginComponent both call getAuthStatus() on init,
    // so every page view would otherwise add another listener.
    const service = TestBed.inject(AuthService);

    service.getAuthStatus();
    service.getAuthStatus();

    const active = unsubscribes.filter((u) => !u.calls.any()).length;
    expect(active).toBe(1);
  });

  it('has no ID token when signed out', async () => {
    const service = TestBed.inject(AuthService);
    expect(await service.getIdToken()).toBeNull();
  });
});
