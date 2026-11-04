import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';
import { DeathThreatService } from './death-threat.service';
import {
  createOfflineFirestore,
  OfflineFirestore,
  pending,
  readCollection,
} from '../../testing/firestore-testing';

describe('DeathThreatService', () => {
  let db: OfflineFirestore;
  let service: DeathThreatService;

  beforeEach(async () => {
    db = await createOfflineFirestore();
    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: db.firestore }],
    });
    service = TestBed.inject(DeathThreatService);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it('returns threats newest first, including ids', async () => {
    pending(
      setDoc(doc(db.firestore, 'threats/old'), {
        message: 'old',
        date: new Date('2026-01-01'),
      }),
    );
    pending(
      setDoc(doc(db.firestore, 'threats/new'), {
        message: 'new',
        date: new Date('2026-05-01'),
      }),
    );

    const threats = await firstValueFrom(service.getThreats());

    expect(threats.map((t) => t.id)).toEqual(['new', 'old']);
  });

  it('stores a new threat with a date', async () => {
    pending(service.newThreat('watch out'));

    const threats = await readCollection(db.firestore, 'threats');
    expect(threats.length).toBe(1);
    expect(threats[0]['message']).toBe('watch out');
    expect(threats[0]['date']).toBeDefined();
  });
});
