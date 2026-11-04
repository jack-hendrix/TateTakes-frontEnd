import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { Navigation, provideRouter, Router } from '@angular/router';
import { Observable, of, Subscriber } from 'rxjs';
import { ExpandedPostComponent } from './expanded-post.component';
import { CommentService } from '../../../services/comment.service';
import { FeedService } from '../../../services/feed.service';
import { Post } from '../../../models/post.model';
import { Comments } from '../../../models/comments.model';
import {
  createAuthServiceStub,
  createUiSpies,
  provideActivatedRoute,
  UiSpies,
} from '../../../../testing/component-testing';

describe('ExpandedPostComponent', () => {
  let fixture: ComponentFixture<ExpandedPostComponent>;
  let component: ExpandedPostComponent;
  let commentService: jasmine.SpyObj<CommentService>;
  let feedService: jasmine.SpyObj<FeedService>;
  let ui: UiSpies;
  let router: Router;
  let commentSubscribers: Subscriber<Comments[]>[];

  const post: Post = {
    id: 'p1',
    title: 'Expanded take',
    body: 'Line one<br>Line two',
    date: new Date('2026-05-05'),
  };
  const comments: Comments[] = [
    { id: 'c1', author: 'Reader', body: 'Nice', date: new Date() },
  ];

  function setup(
    options: {
      params?: Record<string, string>;
      navigationPost?: Post | null;
    } = {},
  ) {
    commentSubscribers = [];
    commentService = jasmine.createSpyObj<CommentService>('CommentService', [
      'getComments',
      'newComment',
    ]);
    // A live stream like collectionData: it stays open until unsubscribed.
    commentService.getComments.and.callFake(
      () =>
        new Observable<Comments[]>((subscriber) => {
          commentSubscribers.push(subscriber);
          subscriber.next(comments);
          return () => {
            commentSubscribers = commentSubscribers.filter(
              (s) => s !== subscriber,
            );
          };
        }),
    );
    feedService = jasmine.createSpyObj<FeedService>('FeedService', ['getPost']);
    feedService.getPost.and.returnValue(of({ ...post, title: 'Fetched' }));
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [ExpandedPostComponent],
      providers: [
        provideRouter([]),
        provideActivatedRoute(
          'post',
          options.params ?? { postId: 'p1', index: '2' },
        ),
        createAuthServiceStub().provider,
        { provide: CommentService, useValue: commentService },
        { provide: FeedService, useValue: feedService },
        ...ui.providers,
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const navigationPost =
      options.navigationPost === undefined ? post : options.navigationPost;
    spyOn(router, 'currentNavigation').and.returnValue(
      navigationPost
        ? ({
            extras: { state: { post: navigationPost } },
          } as unknown as Navigation)
        : null,
    );
    spyOn(window, 'scrollTo');
    fixture = TestBed.createComponent(ExpandedPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('uses the post passed in navigation state', () => {
    setup();
    expect(feedService.getPost).not.toHaveBeenCalled();
    expect(el().querySelector('h1.title')?.textContent?.trim()).toBe(
      'Expanded take',
    );
    expect(component.comments).toEqual(comments);
  });

  it('fetches the post when opened directly by URL', () => {
    setup({ navigationPost: null });
    expect(feedService.getPost).toHaveBeenCalledWith('p1');
    expect(component.post.title).toBe('Fetched');
  });

  it('reads the color index from the route', () => {
    setup({ params: { postId: 'p1', index: '3' } });
    expect(component.index).toBe(3);
  });

  it('falls back to index 1 when the route index is not a number', () => {
    setup({ params: { postId: 'p1', index: 'abc' } });
    expect(component.index).toBe(1);
  });

  it('renders the comments', () => {
    setup();
    expect(el().querySelector('.author')?.textContent).toBe('Reader');
  });

  it('posts a comment with newlines converted to <br>', fakeAsync(() => {
    setup();
    commentService.newComment.and.resolveTo({} as never);
    component.commentForm.setValue({ author: 'Reader', body: 'a\nb' });

    component.submitNewComment();
    tick();

    expect(commentService.newComment).toHaveBeenCalledWith(
      'Reader',
      'a<br>b',
      'p1',
    );
    expect(ui.toastr.success).toHaveBeenCalled();
    expect(component.commentForm.value).toEqual({ author: null, body: null });
  }));

  it('keeps a single comment listener open after posting comments', fakeAsync(() => {
    setup();
    commentService.newComment.and.resolveTo({} as never);

    for (const body of ['first', 'second']) {
      component.commentForm.setValue({ author: 'Reader', body });
      component.submitNewComment();
      tick();
    }

    expect(commentSubscribers.length).toBe(1);
  }));

  it('closes the comment listener when leaving the page', () => {
    setup();
    fixture.destroy();
    expect(commentSubscribers.length).toBe(0);
  });

  it('shows an error when posting a comment fails', fakeAsync(() => {
    setup();
    spyOn(console, 'error');
    commentService.newComment.and.rejectWith(new Error('nope'));
    component.commentForm.setValue({ author: 'Reader', body: 'hi' });

    component.submitNewComment();
    tick();

    expect(ui.toastr.error).toHaveBeenCalled();
    expect(ui.spinner.hide).toHaveBeenCalled();
  }));

  it('enforces the author and comment length limits', () => {
    setup();
    component.commentForm.get('author')?.setValue('a'.repeat(60));
    component.checkCharLimit(50, 'author');
    expect(component.getAuthorLength()).toBe(50);

    component.commentForm.get('body')?.setValue('b'.repeat(600));
    component.checkCharLimit(500, 'body');
    expect(component.getCommentLength()).toBe(500);
  });

  it('goes back to the feed', () => {
    setup();
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/feed']);
  });
});
