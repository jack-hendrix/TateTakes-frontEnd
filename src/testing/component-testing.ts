import { Provider } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, convertToParamMap, UrlSegment } from '@angular/router';
import { User } from '@angular/fire/auth';
import { AuthService } from '../app/services/authentication.service';

export interface UiSpies {
  spinner: jasmine.SpyObj<NgxSpinnerService>;
  toastr: jasmine.SpyObj<ToastrService>;
  providers: Provider[];
}

export function createUiSpies(): UiSpies {
  const spinner = jasmine.createSpyObj<NgxSpinnerService>('NgxSpinnerService', [
    'show',
    'hide',
  ]);
  const toastr = jasmine.createSpyObj<ToastrService>('ToastrService', [
    'success',
    'error',
  ]);
  return {
    spinner,
    toastr,
    providers: [
      { provide: NgxSpinnerService, useValue: spinner },
      { provide: ToastrService, useValue: toastr },
    ],
  };
}

export interface AuthServiceStub {
  authStatus: BehaviorSubject<User | null>;
  service: jasmine.SpyObj<AuthService>;
  provider: Provider;
}

/** Stub for AuthService, which HeaderComponent pulls into most pages. */
export function createAuthServiceStub(signedIn = false): AuthServiceStub {
  const authStatus = new BehaviorSubject<User | null>(
    signedIn ? ({ uid: 'tate' } as User) : null,
  );
  const service = jasmine.createSpyObj<AuthService>(
    'AuthService',
    ['getAuthStatus', 'login', 'logout', 'getIdToken'],
    { currentAuthStatus: authStatus.asObservable() },
  );
  return {
    authStatus,
    service,
    provider: { provide: AuthService, useValue: service },
  };
}

export function provideActivatedRoute(
  path = '',
  params: Record<string, string> = {},
): Provider {
  return {
    provide: ActivatedRoute,
    useValue: {
      url: of(path ? [new UrlSegment(path, {})] : []),
      paramMap: of(convertToParamMap(params)),
      snapshot: { paramMap: convertToParamMap(params) },
    },
  };
}

export function keydown(element: Element, key: string): void {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}
