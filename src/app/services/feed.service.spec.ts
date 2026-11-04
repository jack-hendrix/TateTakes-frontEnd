import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';
import { FeedService } from './feed.service';
import {
  createOfflineFirestore,
  OfflineFirestore,
  pending,
  readCollection,
  readDoc,
} from '../../testing/firestore-testing';

describe('FeedService', () => {
  let db: OfflineFirestore;
  let service: FeedService;

  beforeEach(async () => {
    db = await createOfflineFirestore();
    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: db.firestore }],
    });
    service = TestBed.inject(FeedService);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  function seedPost(id: string, title: string, date: Date) {
    pending(
      setDoc(doc(db.firestore, `posts/${id}`), {
        title,
        body: `${title} body`,
        image: '',
        date,
      }),
    );
  }

  it('returns the feed newest first, including document ids', async () => {
    seedPost('old', 'Old take', new Date('2026-01-01'));
    seedPost('new', 'New take', new Date('2026-06-01'));
    seedPost('mid', 'Mid take', new Date('2026-03-01'));

    const feed = await firstValueFrom(service.getFeed());

    expect(feed.map((p) => p.id)).toEqual(['new', 'mid', 'old']);
    expect(feed[0].title).toBe('New take');
    expect(feed[0].date instanceof Timestamp).toBeTrue();
  });

  it('returns a single post by id', async () => {
    seedPost('abc', 'Hot take', new Date('2026-02-02'));

    const post = await firstValueFrom(service.getPost('abc'));

    expect(post.title).toBe('Hot take');
    expect(post.body).toBe('Hot take body');
  });

  it('creates a post with the given fields and a date', async () => {
    pending(service.newPost('Title', 'Body', 'https://img.example/a.png'));

    const posts = await readCollection(db.firestore, 'posts');
    expect(posts.length).toBe(1);
    expect(posts[0]).toEqual(
      jasmine.objectContaining({
        title: 'Title',
        body: 'Body',
        image: 'https://img.example/a.png',
      }),
    );
    expect(posts[0]['date'] instanceof Timestamp).toBeTrue();
  });

  it('defaults the image to an empty string', async () => {
    pending(service.newPost('Title', 'Body'));

    const posts = await readCollection(db.firestore, 'posts');
    expect(posts[0]['image']).toBe('');
  });

  it('updates an existing post and keeps its original date', async () => {
    const original = new Date('2026-01-15');
    seedPost('p1', 'Before', original);

    pending(
      service.updatePost('p1', {
        title: 'After',
        body: 'New body',
        image: 'img',
        date: original,
      }),
    );

    const post = await readDoc(db.firestore, 'posts/p1');
    expect(post?.['title']).toBe('After');
    expect(post?.['body']).toBe('New body');
    expect((post?.['date'] as Timestamp).toDate()).toEqual(original);
  });

  it('deletes a post', async () => {
    seedPost('p1', 'Doomed', new Date());

    pending(service.deletePost('p1'));

    expect(await readDoc(db.firestore, 'posts/p1')).toBeUndefined();
  });
});
