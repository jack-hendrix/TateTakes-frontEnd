import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { UploadService } from './upload.service';
import {
  AuthServiceStub,
  createAuthServiceStub,
} from '../../testing/component-testing';

describe('UploadService', () => {
  let service: UploadService;
  let http: HttpTestingController;
  let auth: AuthServiceStub;

  beforeEach(() => {
    auth = createAuthServiceStub(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        auth.provider,
      ],
    });
    service = TestBed.inject(UploadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads the file as multipart form data under the "image" key', fakeAsync(() => {
    auth.service.getIdToken.and.resolveTo('id-token');
    const file = new File(['pixels'], 'take.png', { type: 'image/png' });
    let response: { success: boolean; imageUrl: string } | undefined;

    service.uploadImages(file).subscribe((res) => (response = res));
    tick();

    const req = http.expectOne('http://localhost:3000/api/upload-image');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('image')).toEqual(file);

    req.flush({ success: true, imageUrl: 'https://img.example/take.png' });
    expect(response).toEqual({
      success: true,
      imageUrl: 'https://img.example/take.png',
    });
  }));

  it("sends the signed in user's ID token", fakeAsync(() => {
    auth.service.getIdToken.and.resolveTo('id-token');

    service.uploadImages(new File(['x'], 'a.png')).subscribe();
    tick();

    const req = http.expectOne('http://localhost:3000/api/upload-image');
    expect(req.request.headers.get('Authorization')).toBe('Bearer id-token');
    req.flush({ success: true, imageUrl: '' });
  }));

  it('sends no Authorization header when signed out', fakeAsync(() => {
    auth.service.getIdToken.and.resolveTo(null);

    service.uploadImages(new File(['x'], 'a.png')).subscribe();
    tick();

    const req = http.expectOne('http://localhost:3000/api/upload-image');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ success: false, imageUrl: '' });
  }));
});
