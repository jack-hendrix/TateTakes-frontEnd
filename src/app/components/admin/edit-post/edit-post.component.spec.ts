import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EditPostComponent } from './edit-post.component';
import { FeedService } from '../../../services/feed.service';
import { UploadService } from '../../../services/upload.service';
import { Post } from '../../../models/post.model';
import { createUiSpies, UiSpies } from '../../../../testing/component-testing';

describe('EditPostComponent', () => {
  let fixture: ComponentFixture<EditPostComponent>;
  let component: EditPostComponent;
  let feedService: jasmine.SpyObj<FeedService>;
  let uploadService: jasmine.SpyObj<UploadService>;
  let ui: UiSpies;

  const date = new Date('2026-01-01');
  let posts: Post[];

  beforeEach(() => {
    posts = [
      {
        id: 'p1',
        title: 'Original',
        body: 'one<br>two',
        image: 'old.png',
        date,
      },
    ];
    feedService = jasmine.createSpyObj<FeedService>('FeedService', [
      'getFeed',
      'updatePost',
    ]);
    feedService.getFeed.and.returnValue(of(posts));
    uploadService = jasmine.createSpyObj<UploadService>('UploadService', [
      'uploadImages',
    ]);
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [EditPostComponent],
      providers: [
        { provide: FeedService, useValue: feedService },
        { provide: UploadService, useValue: uploadService },
        ...ui.providers,
      ],
    });
    fixture = TestBed.createComponent(EditPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('opens a post for editing with <br> turned back into newlines', () => {
    (el().querySelector('.edit') as HTMLElement).click();
    fixture.detectChanges();

    expect(component.postForm.value.title).toBe('Original');
    expect(component.postForm.value.body).toBe('one\ntwo');
    expect(component.imageUrl).toBe('old.png');
    expect(el().querySelector('form')).not.toBeNull();
  });

  it('saves edits, keeping the original date', fakeAsync(() => {
    feedService.updatePost.and.resolveTo();
    component.selectPost(posts[0]);
    component.postForm.patchValue({ title: 'Edited', body: 'a\nb' });

    component.submitEditPost();
    tick();

    expect(feedService.updatePost).toHaveBeenCalledWith('p1', {
      title: 'Edited',
      body: 'a<br>b',
      image: 'old.png',
      date,
    });
    expect(component.posts[0].title).toBe('Edited');
    expect(component.selectedPost).toBeUndefined();
    expect(ui.toastr.success).toHaveBeenCalled();
  }));

  it('shows an error when saving fails', fakeAsync(() => {
    spyOn(console, 'error');
    feedService.updatePost.and.rejectWith(new Error('denied'));
    component.selectPost(posts[0]);

    component.submitEditPost();
    tick();

    expect(ui.toastr.error).toHaveBeenCalled();
    expect(component.selectedPost).toBe(posts[0]);
  }));

  it('uses the uploaded image URL', () => {
    uploadService.uploadImages.and.returnValue(
      of({ success: true, imageUrl: 'new.png' }),
    );
    const file = new File(['x'], 'new.png');

    component.onFileSelected({ target: { files: [file] } } as unknown as Event);

    expect(uploadService.uploadImages).toHaveBeenCalledWith(file);
    expect(component.imageUrl).toBe('new.png');
    expect(ui.spinner.hide).toHaveBeenCalled();
  });

  it('recovers when an image upload fails', fakeAsync(() => {
    spyOn(console, 'error');
    uploadService.uploadImages.and.returnValue(
      throwError(() => new Error('too large')),
    );
    const file = new File(['x'], 'huge.png');

    component.onFileSelected({ target: { files: [file] } } as unknown as Event);

    // Without an error handler RxJS rethrows the error asynchronously.
    expect(() => flush()).not.toThrow();
    expect(ui.spinner.hide).toHaveBeenCalled();
    expect(ui.toastr.error).toHaveBeenCalled();
  }));

  it('goes back to the list', () => {
    component.selectPost(posts[0]);
    component.goBack();
    expect(component.selectedPost).toBeUndefined();
  });
});
