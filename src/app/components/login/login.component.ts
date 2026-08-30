import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentication.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, HeaderComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);

  loginForm: FormGroup;

  isAuthenticated = false;

  private $destroy = new Subject<void>();

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.authService.getAuthStatus();
    this.authService.currentAuthStatus
      .pipe(takeUntil(this.$destroy))
      .subscribe((authStatus) => {
        this.isAuthenticated = !!authStatus;
      });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  login() {
    this.spinner.show();
    if (!this.isAuthenticated) {
      if (this.loginForm.valid) {
        const { email, password } = this.loginForm.value;
        this.authService
          .login(email, password)
          .then(() => {
            this.spinner.hide();
            this.router.navigate(['/admin']);
          })
          .catch((error) => {
            this.spinner.hide();
            console.error(error);
            this.toastr.error('Please try again later', 'Something went wrong');
          });
      }
    } else {
      this.spinner.hide();
      this.toastr.error('You are already logged in', 'Something went wrong');
    }
  }
}
