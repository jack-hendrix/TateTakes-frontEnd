import { Routes } from '@angular/router';
import { AuthGuard } from '@angular/fire/auth-guard';
import { FeedComponent } from './components/feed/feed.component';
import { redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const redirectUnauthorizedToFeed = () => redirectUnauthorizedTo(['/feed']);

export const routes: Routes = [
  { path: '', redirectTo: '/feed', pathMatch: 'full' },
  { path: 'feed', component: FeedComponent },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'deathThreats',
    loadComponent: () =>
      import('./components/death-threats/death-threats.component').then(
        (m) => m.DeathThreatsComponent,
      ),
  },
  {
    path: 'subscribe',
    loadComponent: () =>
      import('./components/subscribe/subscribe.component').then(
        (m) => m.SubscribeComponent,
      ),
  },
  {
    path: 'post/:postId/:index',
    loadComponent: () =>
      import('./components/post/expanded-post/expanded-post.component').then(
        (m) => m.ExpandedPostComponent,
      ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin.component').then(
        (m) => m.AdminComponent,
      ),
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToFeed },
  },
  { path: '**', component: FeedComponent },
];
