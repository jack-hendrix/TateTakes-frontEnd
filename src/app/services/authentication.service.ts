import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  Unsubscribe,
  User,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = getAuth();

  currentUser: User | null = null;
  private authStatusSub = new BehaviorSubject(this.currentUser);
  currentAuthStatus = this.authStatusSub.asObservable();
  private authListener?: Unsubscribe;

  constructor() {
    this.getAuthStatus();
  }

  getAuthStatus() {
    // The listener lives as long as the service; components call this on
    // init, so only register it once.
    if (this.authListener) {
      return;
    }
    this.authListener = this.auth.onAuthStateChanged((credential) => {
      if (credential) {
        this.authStatusSub.next(credential);
      } else {
        this.authStatusSub.next(null);
      }
    });
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  /** The signed in user's Firebase ID token, refreshed if it has expired. */
  getIdToken(): Promise<string | null> {
    return this.auth.currentUser?.getIdToken() ?? Promise.resolve(null);
  }
}
