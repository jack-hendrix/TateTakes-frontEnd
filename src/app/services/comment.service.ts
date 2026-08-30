import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collectionData,
  addDoc,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { collection } from '@firebase/firestore';
import { Observable } from 'rxjs';
import { Comments } from '../models/comments.model';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private firestore = inject(Firestore);

  getComments(parent: string): Observable<Comments[]> {
    const postsRef = collection(this.firestore, `posts/${parent}/comments`);
    const sortedQuery = query(postsRef, orderBy('date', 'desc'));
    return collectionData(sortedQuery, { idField: 'id' }) as Observable<
      Comments[]
    >;
  }

  newComment(author: string, body: string, parent: string) {
    const postsRef = collection(this.firestore, `posts/${parent}/comments`);
    const comment: Comments = {
      author: author,
      body: body,
      date: new Date(),
    };
    return addDoc(postsRef, comment);
  }
}
