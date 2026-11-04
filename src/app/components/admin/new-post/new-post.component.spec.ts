import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { DocumentReference } from '@angular/fire/firestore';
import { NewPostComponent } from './new-post.component';
import { FeedService } from '../../../services/feed.service';
import { DraftsService } from '../../../services/drafts.service';
import { UploadService } from '../../../services/upload.service';
import { createUiSpies, UiSpies } from '../../../../testing/component-testing';

const AUTOSAVE_MS = 30000;

describe('NewPostComponent', () => {
  let fixture: ComponentFixture<NewPostComponent>;
  let component: NewPostComponent;
  let feedService: jasmine.SpyObj<FeedService>;
  let draftsService: jasmine.SpyObj<DraftsService>;
  let ui: UiSpies;
  let draftCount: number;

  beforeEach(() => {
    draftCount = 0;
    feedService = jasmine.createSpyObj<FeedService>('FeedService', ['newPost']);
    feedService.newPost.and.resolveTo({ id: 'post' } as DocumentReference);
    draftsService = jasmine.createSpyObj<DraftsService>('DraftsService', [
      'newDraft',
      'updateDraft',
      'deleteDraft',
      'draftCreated',
    ]);
    draftsService.newDraft.and.callFake(() =>
      Promise.resolve({ id: `d${++draftCount}` } as DocumentReference),
    );
    draftsService.updateDraft.and.resolveTo();
    draftsService.deleteDraft.and.resolveTo();
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [NewPostComponent],
      providers: [
        { provide: FeedService, useValue: feedService },
        { provide: DraftsService, useValue: draftsService },
        {
          provide: UploadService,
          useValue: jasmine.createSpyObj('UploadService', ['uploadImages']),
        },
        ...ui.providers,
      ],
    });
  });

  function create() {
    fixture = TestBed.createComponent(NewPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function publishButton(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '.publishButton',
    ) as HTMLButtonElement;
  }

  it('enables Publish once the title and body are filled in', fakeAsync(() => {
    create();
    expect(publishButton().disabled).toBeTrue();

    component.postForm.patchValue({ title: 'Title', body: 'Body' });
    fixture.detectChanges();

    expect(publishButton().disabled).toBeFalse();
    discardPeriodicTasks();
  }));

  it('publishes with newlines converted to <br>', fakeAsync(() => {
    create();
    component.postForm.patchValue({ title: 'Title', body: 'a\nb' });

    component.submitNewPost();
    tick();

    expect(feedService.newPost).toHaveBeenCalledWith('Title', 'a<br>b', '');
    expect(ui.toastr.success).toHaveBeenCalled();
    expect(ui.toastr.error).not.toHaveBeenCalled();
    expect(ui.spinner.hide).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('does not try to delete a draft when none was saved', fakeAsync(() => {
    create();
    component.postForm.patchValue({ title: 'Title', body: 'Body' });

    component.submitNewPost();
    tick();

    expect(draftsService.deleteDraft).not.toHaveBeenCalledWith('');
    discardPeriodicTasks();
  }));

  it('autosaves a new draft, then updates it', fakeAsync(() => {
    create();
    component.postForm.patchValue({ title: 'Title', body: 'Body' });

    tick(AUTOSAVE_MS);
    expect(draftsService.newDraft).toHaveBeenCalledWith('Title', 'Body', '');
    expect(draftsService.draftCreated).toHaveBeenCalled();
    expect(component.autosaveText).toContain('Last saved at');

    component.postForm.patchValue({ body: 'More body' });
    tick(AUTOSAVE_MS);
    expect(draftsService.updateDraft).toHaveBeenCalledWith(
      'd1',
      jasmine.objectContaining({ title: 'Title', body: 'More body' }),
    );
    discardPeriodicTasks();
  }));

  it('deletes the autosaved draft when publishing', fakeAsync(() => {
    create();
    component.postForm.patchValue({ title: 'Title', body: 'Body' });
    tick(AUTOSAVE_MS);

    component.submitNewPost();
    tick();

    expect(draftsService.deleteDraft).toHaveBeenCalledWith('d1');
    discardPeriodicTasks();
  }));

  it('starts a new draft for the next post after publishing', fakeAsync(() => {
    create();
    component.postForm.patchValue({ title: 'First', body: 'Body' });
    tick(AUTOSAVE_MS);
    component.submitNewPost();
    tick();

    component.postForm.patchValue({ title: 'Second', body: 'Body' });
    tick(AUTOSAVE_MS);

    // Updating d1 would write to the draft that was just deleted.
    expect(draftsService.updateDraft).not.toHaveBeenCalledWith(
      'd1',
      jasmine.anything(),
    );
    expect(draftsService.newDraft).toHaveBeenCalledTimes(2);
    discardPeriodicTasks();
  }));

  it('saves a draft manually', fakeAsync(() => {
    create();
    component.postForm.patchValue({ title: 'Title', body: 'a\nb' });

    component.saveDraft(new MouseEvent('click'));
    tick();

    expect(draftsService.newDraft).toHaveBeenCalledWith('Title', 'a<br>b', '');
    expect(draftsService.draftCreated).toHaveBeenCalled();
    expect(ui.toastr.success).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('can save a title-only draft after the form was cleared', fakeAsync(() => {
    create();
    component.postForm.patchValue({ title: 'First', body: 'Body' });
    component.saveDraft(new MouseEvent('click'));
    tick();

    // The successful save calls postForm.reset(), which sets body to null.
    component.postForm.patchValue({ title: 'Second' });
    expect(() => component.saveDraft(new MouseEvent('click'))).not.toThrow();
    discardPeriodicTasks();
  }));

  it('shows an error when publishing fails', fakeAsync(() => {
    spyOn(console, 'error');
    feedService.newPost.and.rejectWith(new Error('denied'));
    create();
    component.postForm.patchValue({ title: 'Title', body: 'Body' });

    component.submitNewPost();
    tick();

    expect(ui.toastr.error).toHaveBeenCalled();
    expect(ui.spinner.hide).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('stops autosaving after leaving the page', fakeAsync(() => {
    create();
    component.postForm.patchValue({ title: 'Title', body: 'Body' });

    fixture.destroy();
    tick(AUTOSAVE_MS);

    expect(draftsService.newDraft).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));
});
