import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NewPostComponent } from './new-post/new-post.component';
import { EditPostComponent } from './edit-post/edit-post.component';
import { DeletePostComponent } from './delete-post/delete-post.component';
import { ViewThreatsComponent } from './view-threats/view-threats.component';
import { MatTabsModule } from '@angular/material/tabs';
import { DraftsComponent } from './drafts/drafts.component';

@Component({
  selector: 'app-admin',
  imports: [
    HeaderComponent,
    ReactiveFormsModule,
    NewPostComponent,
    EditPostComponent,
    DeletePostComponent,
    ViewThreatsComponent,
    MatTabsModule,
    DraftsComponent,
  ],
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './admin.component.scss',
})
export class AdminComponent {}
