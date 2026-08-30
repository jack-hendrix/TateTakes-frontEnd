import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FeedService } from '../../../services/feed.service';
import { take } from 'rxjs';
import { Post } from '../../../models/post.model';
import { TimestampToDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { TextFieldModule } from '@angular/cdk/text-field';
import { UploadService } from '../../../services/upload.service';

@Component({
  selector: 'app-edit-post',
  imports: [TimestampToDatePipe, ReactiveFormsModule, TextFieldModule],
  templateUrl: './edit-post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './edit-post.component.scss',
})
export class EditPostComponent implements OnInit {
  private feedService = inject(FeedService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);
  private uploadService = inject(UploadService);

  posts: Post[] = [];
  selectedPost: Post | undefined = undefined;
  postForm: FormGroup;
  selectedFile: File | null = null;
  imageUrl = '';

  constructor() {
    this.postForm = this.fb.group({
      title: ['', [Validators.required]],
      image: [],
      body: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.spinner.show();
    this.feedService
      .getFeed()
      .pipe(take(1))
      .subscribe({
        next: (resp: Post[]) => {
          this.posts = resp;
          this.spinner.hide();
        },
        error: (error) => {
          this.spinner.hide();
          console.error(error);
          this.toastr.error('Please try again later', 'Something went wrong');
        },
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedFile = input.files[0];

      this.spinner.show();

      this.uploadService.uploadImages(this.selectedFile).subscribe((res) => {
        if (res.success) {
          this.imageUrl = res.imageUrl;
        }
        this.spinner.hide();
      });
    }
  }

  selectPost(post: Post): void {
    this.selectedPost = post;
    this.postForm.get('title')?.setValue(post.title);
    this.postForm
      .get('body')
      ?.setValue(post.body.replace(/<br\s*\/?>/gi, '\n'));
    this.imageUrl = post.image || '';
  }

  submitEditPost() {
    if (this.postForm.valid && this.selectedPost?.id) {
      this.spinner.show();
      const { title, body } = this.postForm.value;
      const formattedText = body.replace(/\n/g, '<br>');
      const post: Post = {
        body: formattedText,
        title: title,
        image: this.imageUrl,
        date: this.selectedPost?.date,
      };
      this.feedService
        .updatePost(this.selectedPost.id, post)
        .then(() => {
          this.spinner.hide();
          this.postForm.reset();
          this.posts.forEach((post) => {
            if (post.id === this.selectedPost?.id) {
              post.body = formattedText;
              post.title = title;
              post.image = this.imageUrl;
            }
          });
          this.selectedPost = undefined;
          this.imageUrl = '';
          this.toastr.success('Successfully edited post', 'Success');
        })
        .catch((error) => {
          this.spinner.hide();
          console.error(error);
          this.toastr.error('Please try again later', 'Something went wrong');
        });
    } else {
      console.error('Post has no ID');
      this.toastr.error('Please try again later', 'Something went wrong');
    }
  }

  goBack() {
    this.selectedPost = undefined;
  }
}
