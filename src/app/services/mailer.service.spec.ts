import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { MailerService } from './mailer.service';

describe('MailerService', () => {
  let service: MailerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MailerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the email to the local subscriber API outside production', () => {
    service.addSubscriber('reader@example.com').subscribe();

    const req = http.expectOne('http://localhost:3000/api/subscriber');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'reader@example.com' });
    req.flush({});
  });
});
