import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { DocumentReference } from '@angular/fire/firestore';
import { Subject } from 'rxjs';
import { DraftsComponent } from './drafts.component';
import { DraftsService } from '../../../services/drafts.service';
import { FeedService } from '../../../services/feed.service';
import { UploadService } from '../../../services/upload.service';
import { Post } from '../../../models/post.model';
import { createUiSpies, UiSpies } from '../../../../testing/component-testing';

const AUTOSAVE_MS = 30000;

describe('DraftsComponent', () => {
  let fixture: ComponentFixture<DraftsComponent>;
  let component: DraftsComponent;
  let draftsService: jasmine.SpyObj<DraftsService>;
  let feedService: jasmine.SpyObj<FeedService>;
  let draftCreated: Subject<void>;
  let ui: UiSpies;
  let drafts: Post[];

  beforeEach(() => {
    drafts = [
      {
        id: 'd1',
        title: 'Draft one',
        body: 'one<br/>two',
        image: 'img.png',
        date: new Date('2026-01-01'),
      },
      { id: 'd2', title: '', body: 'untitled', date: new Date('2026-01-02') },
    ];
    draftCreated = new Subject<void>();
    draftsService = jasmine.createSpyObj<DraftsService>(
      'DraftsService',
      ['getDrafts', 'updateDraft', 'deleteDraft'],
      { $draftCreated: draftCreated.asObservable() },
    );
    draftsService.getDrafts.and.callFake(() => Promise.resolve([...drafts]));
    draftsService.updateDraft.and.resolveTo();
    draftsService.deleteDraft.and.resolveTo();
    feedService = jasmine.createSpyObj<FeedService>('FeedService', ['newPost']);
    feedService.newPost.and.resolveTo({ id: 'post' } as DocumentReference);
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [DraftsComponent],
      providers: [
        { provide: DraftsService, useValue: draftsService },
        { provide: FeedService, useValue: feedService },
        {
          provide: UploadService,
          useValue: jasmine.createSpyObj('UploadService', ['uploadImages']),
        },
        ...ui.providers,
      ],
    });
  });

  function create() {
    fixture = TestBed.createComponent(DraftsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('says so when there are no drafts', fakeAsync(() => {
    drafts = [];
    create();
    expect(el().textContent).toContain('You do not have any drafts saved');
    discardPeriodicTasks();
  }));

  it('lists drafts, using the date for untitled ones', fakeAsync(() => {
    create();
    const titles = Array.from(el().querySelectorAll('.title')).map((t) =>
      t.textContent?.trim(),
    );
    expect(titles[0]).toBe('Draft one');
    expect(titles[1]).toBeTruthy();
    expect(ui.spinner.hide).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('reloads when a draft is created elsewhere', fakeAsync(() => {
    create();
    draftsService.getDrafts.calls.reset();

    draftCreated.next();
    tick();

    expect(draftsService.getDrafts).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('opens a draft with <br> turned back into newlines', fakeAsync(() => {
    create();
    (el().querySelector('.edit') as HTMLElement).click();
    fixture.detectChanges();

    expect(component.draftForm.value.title).toBe('Draft one');
    expect(component.draftForm.value.body).toBe('one\ntwo');
    expect(component.imageUrl).toBe('img.png');
    discardPeriodicTasks();
  }));

  it('saves an edited draft', fakeAsync(() => {
    create();
    component.openDraft(drafts[0]);
    component.draftForm.patchValue({ body: 'a\nb' });

    component.submitEditDraft();
    tick();

    expect(draftsService.updateDraft).toHaveBeenCalledWith(
      'd1',
      jasmine.objectContaining({ title: 'Draft one', body: 'a<br>b' }),
    );
    expect(ui.toastr.success).toHaveBeenCalled();
    expect(component.currentDraft).toBeUndefined();
    discardPeriodicTasks();
  }));

  it('reports a failed save as a save error', fakeAsync(() => {
    spyOn(console, 'error');
    draftsService.updateDraft.and.rejectWith(new Error('denied'));
    create();
    component.openDraft(drafts[0]);

    component.submitEditDraft();
    tick();

    expect(ui.toastr.error).toHaveBeenCalled();
    const [, title] = ui.toastr.error.calls.mostRecent().args;
    expect(title).not.toContain('published');
    discardPeriodicTasks();
  }));

  it('publishes a draft and removes it', fakeAsync(() => {
    create();
    component.openDraft(drafts[0]);

    component.publishDraft(new MouseEvent('click'));
    tick();

    expect(feedService.newPost).toHaveBeenCalledWith(
      'Draft one',
      'one<br>two',
      'img.png',
    );
    expect(draftsService.deleteDraft).toHaveBeenCalledWith('d1');
    expect(ui.toastr.success).toHaveBeenCalled();
    expect(component.currentDraft).toBeUndefined();
    discardPeriodicTasks();
  }));

  it('keeps the draft when publishing fails', fakeAsync(() => {
    spyOn(console, 'error');
    feedService.newPost.and.rejectWith(new Error('denied'));
    create();
    component.openDraft(drafts[0]);

    component.publishDraft(new MouseEvent('click'));
    tick();

    expect(draftsService.deleteDraft).not.toHaveBeenCalled();
    expect(ui.toastr.error).toHaveBeenCalled();
    expect(component.currentDraft).toBe(drafts[0]);
    discardPeriodicTasks();
  }));

  it('deletes a draft', fakeAsync(() => {
    create();
    component.openDraft(drafts[0]);

    component.deleteDraft();
    tick();

    expect(draftsService.deleteDraft).toHaveBeenCalledWith('d1');
    expect(component.currentDraft).toBeUndefined();
    discardPeriodicTasks();
  }));

  it('autosaves the open draft', fakeAsync(() => {
    create();
    component.openDraft(drafts[0]);
    component.draftForm.patchValue({ title: 'Renamed' });

    tick(AUTOSAVE_MS);

    expect(draftsService.updateDraft).toHaveBeenCalledWith(
      'd1',
      jasmine.objectContaining({ title: 'Renamed' }),
    );
    expect(component.autosaveText).toContain('Last saved at');
    discardPeriodicTasks();
  }));

  it('stops autosaving after leaving the page', fakeAsync(() => {
    create();
    component.openDraft(drafts[0]);

    fixture.destroy();
    tick(AUTOSAVE_MS);

    expect(draftsService.updateDraft).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));
});
