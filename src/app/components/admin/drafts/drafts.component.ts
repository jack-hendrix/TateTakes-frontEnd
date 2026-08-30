import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DraftsService } from '../../../services/drafts.service';
import { FeedService } from '../../../services/feed.service';
import { Post } from '../../../models/post.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { TimestampToDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import { UploadService } from '../../../services/upload.service';

@Component({
  selector: 'app-drafts',
  imports: [
    ReactiveFormsModule,
    TextFieldModule,
    ReactiveFormsModule,
    TimestampToDatePipe,
  ],
  templateUrl: './drafts.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './drafts.component.scss',
})
export class DraftsComponent implements OnInit, OnDestroy {
  private draftsService = inject(DraftsService);
  private fb = inject(FormBuilder);
  private feedService = inject(FeedService);
  private spinner = inject(NgxSpinnerService);
  private toastr = inject(ToastrService);
  private uploadService = inject(UploadService);

  drafts: Post[] = [];
  currentDraft: Post | undefined;
  draftForm: FormGroup;
  autosaveText = 'Draft Saved';
  autosaving = false;
  selectedFile: File | null = null;
  imageUrl = '';

  private $destroy = new Subject<void>();

  constructor() {
    this.draftForm = this.fb.group({
      title: ['', [Validators.required]],
      image: [''],
      body: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.getDrafts();
    this.draftsService.$draftCreated
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => {
        this.getDrafts();
      });

    setInterval(() => {
      if (this.isDraftValid() && this.currentDraft) {
        this.autosaveText = 'Saving...';
        const { title, body } = this.draftForm.value;
        const formattedText = body.replace(/\n/g, '<br>');
        if (this.currentDraft?.id) {
          const post = {
            title: title,
            image: this.imageUrl,
            body: formattedText,
            date: new Date(),
          };
          this.autosaving = true;
          this.draftsService
            .updateDraft(this.currentDraft.id, post)
            .then(() => {
              this.autosaving = false;
              const currentTime = new Date().toLocaleTimeString();
              this.autosaveText = `Last saved at ${currentTime}`;
            });
        }
      }
    }, 30000);
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
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

  getDrafts() {
    this.spinner.show();
    this.draftsService
      .getDrafts()
      .then((drafts) => {
        this.drafts = drafts;
      })
      .catch((err) => {
        console.error(err);
        this.toastr.error('Please try again later', 'Something went wrong');
      })
      .finally(() => {
        this.spinner.hide();
      });
  }

  openDraft(draft: Post) {
    this.currentDraft = draft;
    this.draftForm.get('title')?.setValue(draft.title);
    this.draftForm
      .get('body')
      ?.setValue(draft.body.replace(/<br\s*\/?>/gi, '\n'));
    this.imageUrl = draft.image || '';
  }

  closeDraft() {
    this.currentDraft = undefined;
  }

  goBack(): void {
    this.closeDraft();
  }

  submitEditDraft() {
    if (this.draftForm.valid && this.currentDraft?.id) {
      this.spinner.show();
      const { title, body } = this.draftForm.value;
      const formattedText: string = body.replace(/\n/g, '<br>');
      const post: Post = {
        title: title,
        body: formattedText,
        image: this.imageUrl,
        date: new Date(),
      };
      this.draftsService
        .updateDraft(this.currentDraft.id, post)
        .then(() => {
          this.toastr.success('Successfully saved draft', 'Success');
        })
        .catch((err) => {
          console.error(err);
          this.toastr.error(
            'Please try deleting again later',
            'Draft published, but could not be deleted',
          );
        })
        .finally(() => {
          this.closeDraft();
          this.imageUrl = '';
          this.getDrafts();
        });
    }
  }

  isDraftValid(): boolean {
    const { title, body } = this.draftForm.value;
    return title || body || this.imageUrl;
  }

  publishDraft(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.draftForm.valid && this.currentDraft?.id) {
      this.spinner.show();
      const { title, body } = this.draftForm.value;
      const formattedText = body.replace(/\n/g, '<br>');
      this.feedService
        .newPost(title, formattedText, this.imageUrl)
        .then(() => {
          if (this.currentDraft?.id) {
            this.draftsService
              .deleteDraft(this.currentDraft.id)
              .then(() => {
                this.toastr.success('Successfully published draft', 'Success');
                this.autosaveText = 'Draft Saved';
              })
              .catch((err) => {
                this.spinner.hide();
                console.error(err);
                this.toastr.error(
                  'Please try deleting again later',
                  'Draft published, but could not be deleted',
                );
              })
              .finally(() => {
                this.closeDraft();
                this.imageUrl = '';
                this.getDrafts();
              });
          }
        })
        .catch((err) => {
          this.spinner.hide();
          console.error(err);
          this.toastr.error('Please try again later', 'Something went wrong');
        });
    }
  }

  deleteDraft() {
    if (this.currentDraft?.id) {
      this.spinner.show();
      this.draftsService
        .deleteDraft(this.currentDraft.id)
        .then(() => {
          this.toastr.success('Successfully deleted draft', 'Success');
          this.closeDraft();
          this.getDrafts();
        })
        .catch((err) => {
          this.spinner.hide();
          console.error(err);
          this.toastr.error('Please try again later', 'Something went wrong');
        });
    }
  }
}
