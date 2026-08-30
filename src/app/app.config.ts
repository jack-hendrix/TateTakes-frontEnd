import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from './environments/environment';
import { routes } from './app.routes';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgxSpinnerService } from 'ngx-spinner';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),

    provideHttpClient(withXhr()),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-below-header',
      preventDuplicates: true,
      progressBar: true,
    }),
    provideAnimations(),
    NgxSpinnerService,
    provideAnimationsAsync(),
  ],
};
