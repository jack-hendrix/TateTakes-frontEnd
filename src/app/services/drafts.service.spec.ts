import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { DraftsService } from './drafts.service';
import { Post } from '../models/post.model';
import {
  createOfflineFirestore,
  OfflineFirestore,
  pending,
  readCollection,
  readDoc,
} from '../../testing/firestore-testing';

describe('DraftsService', () => {
  let db: OfflineFirestore;
  let service: DraftsService;

  beforeEach(async () => {
    db = await createOfflineFirestore();
    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: db.firestore }],
    });
    service = TestBed.inject(DraftsService);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  function seedDraft(id: string, title: string, date: Date) {
    pending(
      setDoc(doc(db.firestore, `drafts/${id}`), {
        title,
        body: 'body',
        image: '',
        date,
      }),
    );
  }

  it('resolves drafts newest first, including ids', async () => {
    seedDraft('a', 'Older', new Date('2026-01-01'));
    seedDraft('b', 'Newer', new Date('2026-02-01'));

    const drafts = await service.getDrafts();

    expect(drafts.map((d) => d.id)).toEqual(['b', 'a']);
  });

  it('creates a draft', async () => {
    pending(service.newDraft('Title', 'Body', 'img'));

    const drafts = await readCollection(db.firestore, 'drafts');
    expect(drafts.length).toBe(1);
    expect(drafts[0]).toEqual(
      jasmine.objectContaining({ title: 'Title', body: 'Body', image: 'img' }),
    );
  });

  it('updates a draft', async () => {
    const date = new Date('2026-04-01');
    seedDraft('d1', 'Before', new Date('2026-01-01'));

    pending(
      service.updateDraft('d1', {
        title: 'After',
        body: 'Body 2',
        image: 'img',
        date,
      }),
    );

    const draft = await readDoc(db.firestore, 'drafts/d1');
    expect(draft?.['title']).toBe('After');
    expect((draft?.['date'] as Timestamp).toDate()).toEqual(date);
  });

  it('fills in a date when the draft has none', async () => {
    seedDraft('d1', 'Before', new Date('2026-01-01'));

    pending(
      service.updateDraft('d1', {
        title: 'After',
        body: 'Body',
        image: '',
      } as unknown as Post),
    );

    const draft = await readDoc(db.firestore, 'drafts/d1');
    expect(draft?.['date'] instanceof Timestamp).toBeTrue();
  });

  it('deletes a draft', async () => {
    seedDraft('d1', 'Doomed', new Date());

    pending(service.deleteDraft('d1'));

    expect(await readDoc(db.firestore, 'drafts/d1')).toBeUndefined();
  });

  it('notifies subscribers when a draft is created', () => {
    const spy = jasmine.createSpy('draftCreated');
    service.$draftCreated.subscribe(spy);

    service.draftCreated();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
