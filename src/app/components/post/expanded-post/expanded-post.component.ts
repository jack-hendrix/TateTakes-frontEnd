import { Subscription, take } from 'rxjs';
import {
  Component,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TimestampToDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import { Post } from '../../../models/post.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommentService } from '../../../services/comment.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { Comments } from '../../../models/comments.model';
import { TextFieldModule } from '@angular/cdk/text-field';
import { ActivatedRoute, Router } from '@angular/router';
import { FeedService } from '../../../services/feed.service';
import { HeaderComponent } from '../../header/header.component';

@Component({
  selector: 'app-expanded-post',
  imports: [
    TimestampToDatePipe,
    ReactiveFormsModule,
    TextFieldModule,
    HeaderComponent,
  ],
  templateUrl: './expanded-post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './expanded-post.component.scss',
})
export class ExpandedPostComponent implements OnDestroy {
  commentForm: FormGroup;
  comments: Comments[] = [];
  colors: string[] = ['#BC4B51', '#5B8E7D', '#F4A259', '#8CB369'];

  private fb = inject(FormBuilder);
  private commentService = inject(CommentService);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);
  private feedService = inject(FeedService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  imageFound = true;
  postId = '';
  post: Post = {
    title: '',
    date: new Date(),
    body: '',
  };
  index = 1;

  private commentsSub?: Subscription;

  constructor() {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.maxLength(50)]],
      body: ['', [Validators.required, Validators.maxLength(500)]],
    });

    this.route.paramMap.subscribe((params) => {
      this.postId = params.get('postId') ?? '';
      const index = parseInt(params.get('index') ?? '', 10);
      this.index = Number.isNaN(index) ? 1 : index;
    });

    this.spinner.show();
    const currentNav = this.router.currentNavigation();
    const post = currentNav?.extras?.state?.['post'] ?? null;
    if (post) {
      this.post = post;
      this.getComments();
      window.scrollTo(0, 0);
    } else {
      this.feedService
        .getPost(this.postId)
        .pipe(take(1))
        .subscribe({
          next: (resp: Post) => {
            this.post = resp;
            this.getComments();
            window.scrollTo(0, 0);
          },
          error: (error) => {
            this.spinner.hide();
            console.error(error);
            this.toastr.error('Please try again later', 'Something went wrong');
          },
        });
    }
  }

  submitNewComment() {
    if (this.commentForm.valid && this.post.id) {
      this.spinner.show();
      const { author, body } = this.commentForm.value;
      const formattedText = body.replace(/\n/g, '<br>');
      this.commentService
        .newComment(author, formattedText, this.post.id)
        .then(() => {
          this.spinner.hide();
          this.commentForm.reset();
          // The comment listener is live, so the new comment shows up on its own.
          this.toastr.success(
            `Your comment has been published succesfully`,
            'Success',
          );
        })
        .catch((error) => {
          this.spinner.hide();
          console.error(error);
          this.toastr.error('Please try again later', 'Something went wrong');
        });
    }
  }

  goBack() {
    this.router.navigate(['/feed']);
  }

  ngOnDestroy() {
    this.commentsSub?.unsubscribe();
  }

  getComments() {
    if (this.postId) {
      this.commentsSub?.unsubscribe();
      this.commentsSub = this.commentService
        .getComments(this.postId)
        .subscribe({
          next: (results) => {
            this.comments = results;
            this.spinner.hide();
          },
          error: (error) => {
            this.spinner.hide();
            console.error(error);
            this.toastr.error('Please try again later', 'Something went wrong');
          },
        });
    }
  }

  checkCharLimit(limit: number, control: string) {
    const bodyControl = this.commentForm.get(control);
    if (bodyControl && bodyControl.value.length > limit) {
      bodyControl.setValue(bodyControl.value.slice(0, limit));
    }
  }

  imageError() {
    console.error(`Error finding image\n${this.post.image}`);
    this.imageFound = false;
  }

  getAuthorLength() {
    return this.commentForm.get('author')?.value?.length;
  }

  getCommentLength() {
    return this.commentForm.get('body')?.value?.length;
  }
}
