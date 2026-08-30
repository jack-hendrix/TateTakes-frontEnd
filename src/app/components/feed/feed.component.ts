import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FeedService } from '../../services/feed.service';
import { Subject, take } from 'rxjs';
import { Post } from '../../models/post.model';
import { PostComponent } from '../post/post.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feed',
  imports: [HeaderComponent, PostComponent],
  templateUrl: './feed.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './feed.component.scss',
})
export class FeedComponent implements OnInit, OnDestroy {
  private feedService = inject(FeedService);
  private spinner = inject(NgxSpinnerService);
  private router = inject(Router);

  private $destroy = new Subject<void>();

  feed: Post[] = [];
  somethingWentWrong = false;

  ngOnInit(): void {
    this.spinner.show();

    this.feedService
      .getFeed()
      .pipe(take(1))
      .subscribe({
        next: (response: Post[]) => {
          this.feed = response;
          this.spinner.hide();
          window.scrollTo(0, 0);
        },
        error: (error) => {
          console.error(error);
          this.somethingWentWrong = true;
          this.spinner.hide();
        },
      });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  expandPost(post: Post, index: number): void {
    this.router.navigate([`/post/${post.id}/${index}`], {
      state: { post: post },
    });
  }
}
