import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PostComponent } from './post.component';
import { CommentService } from '../../services/comment.service';
import { Post } from '../../models/post.model';
import { Comments } from '../../models/comments.model';
import { createUiSpies, UiSpies } from '../../../testing/component-testing';

describe('PostComponent', () => {
  let fixture: ComponentFixture<PostComponent>;
  let component: PostComponent;
  let commentService: jasmine.SpyObj<CommentService>;
  let ui: UiSpies;

  const basePost: Post = {
    id: 'p1',
    title: 'A take',
    body: 'Short body',
    date: new Date('2026-05-05'),
  };

  function setup(
    post: Partial<Post> = {},
    comments: Comments[] = [],
    inputs: { index?: number; total?: number } = {},
  ) {
    commentService = jasmine.createSpyObj<CommentService>('CommentService', [
      'getComments',
    ]);
    commentService.getComments.and.returnValue(of(comments));
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [PostComponent],
      providers: [
        { provide: CommentService, useValue: commentService },
        ...ui.providers,
      ],
    });
    fixture = TestBed.createComponent(PostComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('post', { ...basePost, ...post });
    fixture.componentRef.setInput('index', inputs.index ?? 0);
    fixture.componentRef.setInput('total', inputs.total ?? 1);
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function comment(n: number): Comments[] {
    return Array.from({ length: n }, (_, i) => ({
      author: `a${i}`,
      body: 'b',
      date: new Date(),
    }));
  }

  it('shows the full body of a short post without Read More', () => {
    setup();
    expect(component.textToShow).toBe('Short body');
    expect(el().querySelector('.readMore')).toBeNull();
  });

  it('truncates long posts and offers Read More', () => {
    setup({ body: 'x'.repeat(3000) });
    expect(component.textToShow.endsWith('...')).toBeTrue();
    expect(component.textToShow.length).toBeLessThan(3000);
    expect(el().querySelector('.readMore')).not.toBeNull();
  });

  it('does not add an ellipsis when nothing was cut off', () => {
    // Bodies between 701 and 1500 characters are shown in full, yet still
    // get "..." appended.
    setup({ body: 'x'.repeat(1000) });
    expect(component.textToShow.endsWith('...')).toBeFalse();
  });

  it('numbers posts counting down from the total', () => {
    setup({}, [], { index: 0, total: 5 });
    expect(el().querySelector('.badge')?.textContent?.trim()).toBe('No. 5');
  });

  it('uses a color based on the index', () => {
    setup({}, [], { index: 5, total: 6 });
    const card = el().querySelector('.card') as HTMLElement;
    expect(card.style.borderColor).toBe('rgb(91, 142, 125)');
  });

  it('invites a comment when there are none', () => {
    setup({}, []);
    expect(el().querySelector('#comments')?.textContent?.trim()).toBe(
      'Leave a comment',
    );
  });

  it('uses the singular for one comment', () => {
    setup({}, comment(1));
    expect(el().querySelector('#comments')?.textContent?.trim()).toBe(
      '1 comment',
    );
  });

  it('uses the plural for several comments', () => {
    setup({}, comment(3));
    expect(el().querySelector('#comments')?.textContent?.trim()).toBe(
      '3 comments',
    );
  });

  it('does not load comments for a post without an id', () => {
    setup({ id: undefined });
    expect(commentService.getComments).not.toHaveBeenCalled();
  });

  it('shows an error when comments fail to load', () => {
    spyOn(console, 'error');
    commentService = jasmine.createSpyObj<CommentService>('CommentService', [
      'getComments',
    ]);
    commentService.getComments.and.returnValue(
      throwError(() => new Error('offline')),
    );
    ui = createUiSpies();
    TestBed.configureTestingModule({
      imports: [PostComponent],
      providers: [
        { provide: CommentService, useValue: commentService },
        ...ui.providers,
      ],
    });
    fixture = TestBed.createComponent(PostComponent);
    fixture.componentRef.setInput('post', basePost);
    fixture.componentRef.setInput('index', 0);
    fixture.detectChanges();

    expect(ui.toastr.error).toHaveBeenCalled();
  });

  it('emits expandPost from the title and comments link', () => {
    setup();
    const spy = jasmine.createSpy('expand');
    component.expandPost.subscribe(spy);

    (el().querySelector('.title') as HTMLElement).click();
    (el().querySelector('#comments') as HTMLElement).click();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('hides the image if it fails to load', () => {
    spyOn(console, 'error');
    setup({ image: 'https://img.example/missing.png' });
    expect(el().querySelector('img.postImage')).not.toBeNull();

    el().querySelector('img.postImage')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(el().querySelector('img.postImage')).toBeNull();
  });

  it('makes its links keyboard focusable', () => {
    setup({ body: 'x'.repeat(3000) });
    // tabindex="{0}" is a literal string, not 0, so browsers ignore it.
    expect(el().querySelector('.readMore')?.getAttribute('tabindex')).toBe('0');
    expect(el().querySelector('#comments')?.getAttribute('tabindex')).toBe('0');
  });
});
