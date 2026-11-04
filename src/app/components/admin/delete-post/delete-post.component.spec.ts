import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeletePostComponent } from './delete-post.component';
import { FeedService } from '../../../services/feed.service';
import { Post } from '../../../models/post.model';
import {
  createUiSpies,
  keydown,
  UiSpies,
} from '../../../../testing/component-testing';

describe('DeletePostComponent', () => {
  let fixture: ComponentFixture<DeletePostComponent>;
  let component: DeletePostComponent;
  let feedService: jasmine.SpyObj<FeedService>;
  let ui: UiSpies;

  const posts: Post[] = [
    { id: 'a', title: 'Short title', body: '', date: new Date() },
    { id: 'b', title: 'L'.repeat(80), body: '', date: new Date() },
  ];

  function setup(feed$ = of(posts.map((p) => ({ ...p })))) {
    feedService = jasmine.createSpyObj<FeedService>('FeedService', [
      'getFeed',
      'deletePost',
    ]);
    feedService.getFeed.and.returnValue(feed$);
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [DeletePostComponent],
      providers: [
        { provide: FeedService, useValue: feedService },
        ...ui.providers,
      ],
    });
    fixture = TestBed.createComponent(DeletePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('lists posts and truncates long titles to 50 characters', () => {
    setup();
    const titles = Array.from(el().querySelectorAll('.title')).map(
      (t) => t.textContent,
    );
    expect(titles).toEqual(['Short title', 'L'.repeat(50) + '...']);
  });

  it('shows an error when posts fail to load', () => {
    spyOn(console, 'error');
    setup(throwError(() => new Error('offline')));
    expect(ui.toastr.error).toHaveBeenCalled();
    expect(ui.spinner.hide).toHaveBeenCalled();
  });

  it('removes the post right away and confirms once deleted', fakeAsync(() => {
    setup();
    feedService.deletePost.and.resolveTo();

    (el().querySelector('.delete') as HTMLElement).click();
    expect(component.posts.map((p) => p.id)).toEqual(['b']);
    tick();

    expect(feedService.deletePost).toHaveBeenCalledWith('a');
    expect(ui.toastr.success).toHaveBeenCalled();
  }));

  it('restores the list when deleting fails', fakeAsync(() => {
    setup();
    spyOn(console, 'error');
    feedService.deletePost.and.rejectWith(new Error('denied'));

    component.deletePost('a');
    tick();

    expect(component.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(ui.toastr.error).toHaveBeenCalled();
  }));

  it('refuses to delete a post without an id', () => {
    setup();
    spyOn(console, 'error');

    component.deletePost('');

    expect(feedService.deletePost).not.toHaveBeenCalled();
    expect(ui.toastr.error).toHaveBeenCalled();
  });

  it('does not delete a post when tabbing past its Delete link', () => {
    setup();
    feedService.deletePost.and.resolveTo();

    keydown(el().querySelector('.delete') as HTMLElement, 'Tab');

    expect(feedService.deletePost).not.toHaveBeenCalled();
  });
});
