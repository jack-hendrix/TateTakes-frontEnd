import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/authentication.service';
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

enum PAGES {
  DeathThreats = 'deathThreats',
  Login = 'login',
  Subscribe = 'subscribe',
  Admin = 'admin',
}

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);
  private activatedRoute = inject(ActivatedRoute);

  isAuthenticated = false;
  currentPage: string | undefined;

  private $destroy = new Subject<void>();

  ngOnInit(): void {
    this.authService.getAuthStatus();
    this.authService.currentAuthStatus
      .pipe(takeUntil(this.$destroy))
      .subscribe((authStatus) => (this.isAuthenticated = !!authStatus));

    this.activatedRoute.url
      .pipe(takeUntil(this.$destroy))
      .subscribe((urlSegments) => {
        this.currentPage = urlSegments.map((segment) => segment.path).join('/');
      });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  logout() {
    this.spinner.show();
    this.authService
      .logout()
      .then(() => {
        this.spinner.hide();
        this.router.navigate(['/feed']);
      })
      .catch((error) => {
        this.spinner.hide();
        console.error(error);
        this.toastr.error('Please try again later', 'Something went wrong');
      });
  }

  login() {
    this.router.navigate(['/login']);
  }

  subscribe() {
    this.router.navigate(['/subscribe']);
  }

  goHome() {
    this.router.navigate(['/feed']);
  }

  admin() {
    this.router.navigate(['/admin']);
  }

  threaten() {
    this.router.navigate(['/deathThreats']);
  }

  protected readonly PAGES = PAGES;
}
