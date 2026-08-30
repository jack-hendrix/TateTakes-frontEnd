import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DeathThreatService } from '../../services/death-threat.service';
import { HeaderComponent } from '../header/header.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-death-threats',
  imports: [
    ReactiveFormsModule,
    HeaderComponent,
    CommonModule,
    TextFieldModule,
  ],
  templateUrl: './death-threats.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './death-threats.component.scss',
})
export class DeathThreatsComponent {
  threatForm: FormGroup;

  private fb = inject(FormBuilder);
  private deathThreatService = inject(DeathThreatService);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);

  constructor() {
    this.threatForm = this.fb.group({
      message: ['', [Validators.required]],
    });
  }

  submitNewThreat() {
    if (this.threatForm.valid) {
      this.spinner.show();
      const { message } = this.threatForm.value;
      const formattedMessage = message.replace(/\n/g, '<br>');
      this.deathThreatService
        .newThreat(formattedMessage)
        .then(() => {
          this.spinner.hide();
          this.threatForm.reset();
          this.toastr.success('That will show him!', 'Threat sent succesfully');
        })
        .catch((error) => {
          this.spinner.hide();
          console.error(error);
          this.toastr.error('Please try again later', 'Something went wrong');
        });
    }
  }

  checkCharLimit() {
    const bodyControl = this.threatForm.get('message');
    if (bodyControl && bodyControl.value.length > 1000) {
      bodyControl.setValue(bodyControl.value.slice(0, 1000));
    }
  }

  getMessageLength() {
    return this.threatForm.get('message')?.value?.length;
  }
}
