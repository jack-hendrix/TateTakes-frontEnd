import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SubscribeComponent } from './subscribe.component';
import { MailerService } from '../../services/mailer.service';
import {
  createAuthServiceStub,
  createUiSpies,
  provideActivatedRoute,
  UiSpies,
} from '../../../testing/component-testing';

describe('SubscribeComponent', () => {
  let fixture: ComponentFixture<SubscribeComponent>;
  let component: SubscribeComponent;
  let mailer: jasmine.SpyObj<MailerService>;
  let ui: UiSpies;

  beforeEach(() => {
    mailer = jasmine.createSpyObj<MailerService>('MailerService', [
      'addSubscriber',
    ]);
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [SubscribeComponent],
      providers: [
        provideRouter([]),
        provideActivatedRoute('subscribe'),
        createAuthServiceStub().provider,
        { provide: MailerService, useValue: mailer },
        ...ui.providers,
      ],
    });
    fixture = TestBed.createComponent(SubscribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not submit an invalid email', () => {
    component.subscribeForm.setValue({ email: 'nope' });
    component.submit();
    expect(mailer.addSubscriber).not.toHaveBeenCalled();
  });

  it('subscribes and clears the form', () => {
    mailer.addSubscriber.and.returnValue(of({}));
    component.subscribeForm.setValue({ email: 'reader@example.com' });

    component.submit();

    expect(mailer.addSubscriber).toHaveBeenCalledWith('reader@example.com');
    expect(ui.toastr.success).toHaveBeenCalled();
    expect(component.subscribeForm.value.email).toBeNull();
    expect(ui.spinner.hide).toHaveBeenCalled();
  });

  it('shows an error and keeps the email when subscribing fails', () => {
    spyOn(console, 'error');
    mailer.addSubscriber.and.returnValue(
      throwError(() => new Error('server down')),
    );
    component.subscribeForm.setValue({ email: 'reader@example.com' });

    component.submit();

    expect(ui.toastr.error).toHaveBeenCalled();
    expect(component.subscribeForm.value.email).toBe('reader@example.com');
    expect(ui.spinner.hide).toHaveBeenCalled();
  });
});
