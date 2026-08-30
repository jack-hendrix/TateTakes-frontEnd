import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MailerService } from '../../services/mailer.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { take } from 'rxjs';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-subscribe',
  imports: [ReactiveFormsModule, HeaderComponent],
  templateUrl: './subscribe.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './subscribe.component.scss',
})
export class SubscribeComponent {
  private mailerService = inject(MailerService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);

  subscribeForm: FormGroup;

  constructor() {
    this.subscribeForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  submit() {
    if (this.subscribeForm.valid) {
      this.spinner.show();
      const { email } = this.subscribeForm.value;
      this.mailerService
        .addSubscriber(email)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.spinner.hide();
            this.subscribeForm.reset();
            this.toastr.success(`You subscribed successfully`, 'Success');
          },
          error: (error) => {
            this.spinner.hide();
            console.error(error);
            this.toastr.error('Please try again later', 'Something went wrong');
          },
        });
    }
  }
}
