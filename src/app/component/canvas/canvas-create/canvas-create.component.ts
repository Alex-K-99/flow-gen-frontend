// canvas-create.component.ts
import { Component } from '@angular/core';
import {CanvasService} from "../../../service/canvas.service";
import {FormsModule} from "@angular/forms";
import {MatFormField} from "@angular/material/form-field";
import {MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatButton} from "@angular/material/button";
import {RouterLink} from "@angular/router";
import {Canvas} from "../../../dto/canvas";


@Component({
  selector: 'app-canvas-create',
  templateUrl: './canvas-create.component.html',
  standalone: true,
  imports: [
    FormsModule,
    MatFormField,
    MatInput,
    MatButton,
    RouterLink
  ],
  styleUrls: ['./canvas-create.component.scss']
})
export class CanvasCreateComponent {
  canvasName: string = '';
  modclass: string = '';
  packageBase: string = '';

  constructor(private canvasService: CanvasService) {}

  onSubmit(): void {
    const canvas :Canvas = {
      name: this.canvasName,
      modClass: this.modclass,
      packageBase: this.packageBase
    };

    this.canvasService.create(canvas).subscribe({
      next: (response) => {
        console.log('Canvas created successfully:', response);
        // Optionally reset form or navigate away
      },
      error: (error) => {
        console.error('Error creating canvas:', error);
      }
    });
  }
}
