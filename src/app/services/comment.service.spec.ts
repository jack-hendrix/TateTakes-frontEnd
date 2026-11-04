import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';
import { CommentService } from './comment.service';
import {
  createOfflineFirestore,
  OfflineFirestore,
  pending,
  readCollection,
} from '../../testing/firestore-testing';

describe('CommentService', () => {
  let db: OfflineFirestore;
  let service: CommentService;

  beforeEach(async () => {
    db = await createOfflineFirestore();
    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: db.firestore }],
    });
    service = TestBed.inject(CommentService);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it('returns comments for a post newest first, including ids', async () => {
    pending(
      setDoc(doc(db.firestore, 'posts/p1/comments/a'), {
        author: 'A',
        body: 'first',
        date: new Date('2026-01-01'),
      }),
    );
    pending(
      setDoc(doc(db.firestore, 'posts/p1/comments/b'), {
        author: 'B',
        body: 'second',
        date: new Date('2026-02-01'),
      }),
    );
    pending(
      setDoc(doc(db.firestore, 'posts/other/comments/c'), {
        author: 'C',
        body: 'elsewhere',
        date: new Date('2026-03-01'),
      }),
    );

    const comments = await firstValueFrom(service.getComments('p1'));

    expect(comments.map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('adds a comment under the parent post', async () => {
    pending(service.newComment('Reader', 'Great take', 'p1'));

    const comments = await readCollection(db.firestore, 'posts/p1/comments');
    expect(comments.length).toBe(1);
    expect(comments[0]).toEqual(
      jasmine.objectContaining({ author: 'Reader', body: 'Great take' }),
    );
    expect(comments[0]['date']).toBeDefined();
  });
});
