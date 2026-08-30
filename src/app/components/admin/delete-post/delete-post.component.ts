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
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-delete-post',
  imports: [TimestampToDatePipe],
  templateUrl: './delete-post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './delete-post.component.scss',
})
export class DeletePostComponent implements OnInit {
  private feedService = inject(FeedService);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);

  posts: Post[] = [];

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

  deletePost(id: string): void {
    this.spinner.show();
    if (id) {
      const temp = [...this.posts];
      this.posts = this.posts.filter((post) => post.id !== id);
      this.feedService
        .deletePost(id)
        .then(() => {
          this.spinner.hide();
          this.toastr.success('Successfully deleted post', 'Success');
        })
        .catch((error) => {
          console.error(error);
          this.toastr.error('Please try again later', 'Something went wrong');
          this.spinner.hide();
          this.posts = temp;
        });
    } else {
      console.error('Post has no Id.');
      this.spinner.hide();
      this.toastr.error('Please try again later', 'Something went wrong');
    }
  }
}
