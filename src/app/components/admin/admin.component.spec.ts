import {
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminComponent } from './admin.component';
import { FeedService } from '../../services/feed.service';
import { DraftsService } from '../../services/drafts.service';
import { DeathThreatService } from '../../services/death-threat.service';
import { UploadService } from '../../services/upload.service';
import {
  createAuthServiceStub,
  createUiSpies,
  provideActivatedRoute,
} from '../../../testing/component-testing';

describe('AdminComponent', () => {
  it('shows a tab for each admin tool', fakeAsync(() => {
    const feedService = jasmine.createSpyObj<FeedService>('FeedService', [
      'getFeed',
    ]);
    feedService.getFeed.and.returnValue(of([]));
    const threats = jasmine.createSpyObj<DeathThreatService>(
      'DeathThreatService',
      ['getThreats'],
    );
    threats.getThreats.and.returnValue(of([]));
    const drafts = jasmine.createSpyObj<DraftsService>(
      'DraftsService',
      ['getDrafts'],
      { $draftCreated: of() },
    );
    drafts.getDrafts.and.resolveTo([]);

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideRouter([]),
        provideActivatedRoute('admin'),
        createAuthServiceStub(true).provider,
        { provide: FeedService, useValue: feedService },
        { provide: DeathThreatService, useValue: threats },
        { provide: DraftsService, useValue: drafts },
        {
          provide: UploadService,
          useValue: jasmine.createSpyObj('UploadService', ['uploadImages']),
        },
        ...createUiSpies().providers,
      ],
    });
    const fixture = TestBed.createComponent(AdminComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const tabs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[role=tab]'),
    ).map((t) => t.textContent?.trim());
    expect(tabs).toEqual([
      'View Threats',
      'New Post',
      'Drafts',
      'Edit Post',
      'Delete Post',
    ]);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-view-threats'),
    ).not.toBeNull();
    // New Post and Drafts start autosave intervals.
    discardPeriodicTasks();
  }));
});
