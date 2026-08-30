import { take } from 'rxjs';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Post } from '../../models/post.model';
import { TimestampToDatePipe } from '../../pipes/timestamp-to-date.pipe';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { CommentService } from '../../services/comment.service';

@Component({
  selector: 'app-post',
  imports: [TimestampToDatePipe, CommonModule],
  templateUrl: './post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './post.component.scss',
})
export class PostComponent implements OnInit {
  @Input({ required: true }) post!: Post;
  @Input({ required: true }) index!: number;
  @Output() expandPost = new EventEmitter<void>();

  private commentService = inject(CommentService);
  private toastr = inject(ToastrService);

  textToShow = '';
  colors: string[] = ['#BC4B51', '#5B8E7D', '#F4A259', '#8CB369'];

  commentCount = 0;
  imageFound = true;

  ngOnInit(): void {
    if (this.post.body.length > 700) {
      this.textToShow = this.post.body.slice(0, 1500) + '...';
    } else {
      this.textToShow = this.post.body;
    }
    if (this.post?.id) {
      this.commentService
        .getComments(this.post.id)
        .pipe(take(1))
        .subscribe({
          next: (resp) => {
            this.commentCount = resp.length;
          },
          error: (err) => {
            console.error(err);
            this.toastr.error('Please try again later', 'Something went wrong');
          },
        });
    }
  }

  showComments() {
    this.expandPost.emit();
  }

  expand() {
    this.expandPost.emit();
  }

  imageError() {
    console.error(`Error finding image\n${this.post.image}`);
    this.imageFound = false;
  }
}
