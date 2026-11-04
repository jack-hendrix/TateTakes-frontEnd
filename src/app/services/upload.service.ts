import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  uploadImages(image: File) {
    const formData = new FormData();
    formData.append('image', image);

    const url = environment.production
      ? '/api/upload-image'
      : 'http://localhost:3000/api/upload-image';

    // The upload API only accepts requests from the signed in admin.
    return from(this.authService.getIdToken()).pipe(
      switchMap((token) =>
        this.http.post<{ success: boolean; imageUrl: string }>(url, formData, {
          headers: token
            ? new HttpHeaders({ Authorization: `Bearer ${token}` })
            : undefined,
        }),
      ),
    );
  }
}
