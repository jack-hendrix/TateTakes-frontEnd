import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { FeedComponent } from './feed.component';
import { FeedService } from '../../services/feed.service';
import { CommentService } from '../../services/comment.service';
import { Post } from '../../models/post.model';
import {
  createAuthServiceStub,
  createUiSpies,
  provideActivatedRoute,
  UiSpies,
} from '../../../testing/component-testing';

describe('FeedComponent', () => {
  let fixture: ComponentFixture<FeedComponent>;
  let feedService: jasmine.SpyObj<FeedService>;
  let ui: UiSpies;
  let router: Router;

  const posts: Post[] = [
    { id: 'b', title: 'Newer', body: 'two', date: new Date('2026-02-01') },
    { id: 'a', title: 'Older', body: 'one', date: new Date('2026-01-01') },
  ];

  function setup(feed$ = of(posts)) {
    feedService = jasmine.createSpyObj<FeedService>('FeedService', ['getFeed']);
    feedService.getFeed.and.returnValue(feed$);
    const commentService = jasmine.createSpyObj<CommentService>(
      'CommentService',
      ['getComments'],
    );
    commentService.getComments.and.returnValue(of([]));
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [FeedComponent],
      providers: [
        provideRouter([]),
        provideActivatedRoute('feed'),
        createAuthServiceStub().provider,
        { provide: FeedService, useValue: feedService },
        { provide: CommentService, useValue: commentService },
        ...ui.providers,
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(window, 'scrollTo');
    fixture = TestBed.createComponent(FeedComponent);
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders a card for each post', () => {
    setup();
    const titles = Array.from(el().querySelectorAll('app-post .title')).map(
      (t) => t.textContent?.trim(),
    );
    expect(titles).toEqual(['Newer', 'Older']);
    expect(el().querySelector('.nothingToShow')).toBeNull();
    expect(ui.spinner.hide).toHaveBeenCalled();
  });

  it('opens a post with its data passed in navigation state', () => {
    setup();
    (el().querySelector('app-post .title') as HTMLElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['/post/b/0'], {
      state: { post: posts[0] },
    });
  });

  it('shows an empty state when there are no posts', () => {
    setup(of([]));
    expect(el().querySelector('.nothingToShow')).not.toBeNull();
  });

  it('does not claim there are no posts while the feed is loading', () => {
    setup(new Subject<Post[]>());
    expect(el().querySelector('.nothingToShow')).toBeNull();
  });

  it('shows only the error message when the feed fails to load', () => {
    spyOn(console, 'error');
    setup(throwError(() => new Error('offline')));
    expect(el().textContent).toContain('Something went wrong');
    expect(el().querySelector('.nothingToShow')).toBeNull();
    expect(ui.spinner.hide).toHaveBeenCalled();
  });
});
