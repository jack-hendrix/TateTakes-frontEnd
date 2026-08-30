import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FeedService } from '../../../services/feed.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DraftsService } from '../../../services/drafts.service';
import { UploadService } from '../../../services/upload.service';

@Component({
  selector: 'app-new-post',
  imports: [ReactiveFormsModule, TextFieldModule],
  templateUrl: './new-post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './new-post.component.scss',
})
export class NewPostComponent implements OnInit {
  private fb = inject(FormBuilder);
  private feedService = inject(FeedService);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);
  private draftsService = inject(DraftsService);
  private uploadService = inject(UploadService);

  postForm: FormGroup;
  draftId = '';
  autosaveText = 'Draft not saved!';
  autosaving = false;
  selectedFile: File | null = null;
  imageUrl = '';

  constructor() {
    this.postForm = this.fb.group({
      title: ['', [Validators.required]],
      image: [''],
      body: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    setInterval(() => {
      if (this.isValidDraft) {
        this.autosaveText = 'Saving...';
        const { title, body } = this.postForm.value;
        const formattedText = body.replace(/\n/g, '<br>');
        this.autosaving = true;
        if (this.draftId === '') {
          this.draftsService
            .newDraft(title, formattedText, this.imageUrl)
            .then((docRef) => {
              this.draftId = docRef.id;
              const currentTime = new Date().toLocaleTimeString();
              this.autosaveText = `Last saved at ${currentTime}`;
              this.draftsService.draftCreated();
              this.autosaving = false;
            });
        } else {
          const post = {
            title: title,
            image: this.imageUrl,
            body: formattedText,
            date: new Date(),
          };
          this.draftsService.updateDraft(this.draftId, post).then(() => {
            const currentTime = new Date().toLocaleTimeString();
            this.autosaveText = `Last saved at ${currentTime}`;
            this.autosaving = false;
          });
        }
      }
    }, 30000);
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

  submitNewPost() {
    if (this.postForm.valid) {
      this.spinner.show();
      const { title, body } = this.postForm.value;
      const formattedText = body.replace(/\n/g, '<br>');
      this.feedService
        .newPost(title, formattedText, this.imageUrl)
        .then(() => {
          this.postForm.reset();
          this.imageUrl = '';
          this.draftsService.deleteDraft(this.draftId).then(() => {
            this.autosaveText = 'Draft not saved!';
          });
          this.toastr.success(
            `Your post, ${title}, has been published successfully`,
            'Success',
          );
        })
        .catch((error) => {
          console.error(error);
          this.toastr.error('Please try again later', 'Something went wrong');
        })
        .finally(() => {
          this.spinner.hide();
        });
    }
  }

  saveDraft(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.spinner.show();
    const { title, body } = this.postForm.value;
    const formattedText = body.replace(/\n/g, '<br>');
    const post = {
      title: title,
      image: this.imageUrl,
      body: formattedText,
      date: new Date(),
    };
    if (this.draftId) {
      this.draftsService
        .updateDraft(this.draftId, post)
        .then(() => {
          this.postForm.reset();
          this.imageUrl = '';
          this.toastr.success(`Your draft was saved successfully`, 'Success');
        })
        .catch((error) => {
          console.error(error);
          this.toastr.error('Please try again later', 'Something went wrong');
        })
        .finally(() => {
          this.spinner.hide();
        });
    } else {
      this.draftsService
        .newDraft(title, formattedText, this.imageUrl)
        .then(() => {
          this.postForm.reset();
          this.imageUrl = '';
          this.toastr.success(`Your draft was saved successfully`, 'Success');
          this.draftsService.draftCreated();
        })
        .catch((error) => {
          console.error(error);
          this.toastr.error('Please try again later', 'Something went wrong');
        })
        .finally(() => {
          this.spinner.hide();
        });
    }
  }

  get isValidDraft(): boolean {
    const { title, body } = this.postForm.value;
    return title || this.imageUrl || body;
  }
}
