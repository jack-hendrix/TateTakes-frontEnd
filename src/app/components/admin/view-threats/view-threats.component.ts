import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Threat } from '../../../models/threat.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { DeathThreatService } from '../../../services/death-threat.service';
import { take } from 'rxjs';
import { TimestampToDatePipe } from '../../../pipes/timestamp-to-date.pipe';

@Component({
  selector: 'app-view-threats',
  imports: [TimestampToDatePipe],
  templateUrl: './view-threats.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './view-threats.component.scss',
})
export class ViewThreatsComponent implements OnInit {
  private spinner = inject(NgxSpinnerService);
  private toastr = inject(ToastrService);
  private deathThreatService = inject(DeathThreatService);

  threats: Threat[] = [];

  ngOnInit(): void {
    this.spinner.show();
    this.deathThreatService
      .getThreats()
      .pipe(take(1))
      .subscribe({
        next: (threats) => {
          this.threats = threats;
          this.spinner.hide();
        },
        error: (error) => {
          console.error(error);
          this.spinner.hide();
          this.toastr.error('Please try again later', 'Something went wrong');
        },
      });
  }
}
