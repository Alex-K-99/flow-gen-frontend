import { Component, ElementRef, AfterViewInit, ViewChild, Input } from '@angular/core';
import * as $ from 'jquery'; // Import jQuery with correct types
import draw2d from 'draw2d';  // Import draw2d without types, relying on custom declaration

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef;

  ngAfterViewInit(): void {
    const canvasElement = document.querySelector('#canvasContainer');

    // Initialize the draw2d Canvas with the ID of a valid HTML element
    const canvas = canvasElement ? new draw2d.Canvas(canvasElement.id) : 'Nope';
    
    // Example: Adding a square (node) to the canvas
    const square = new draw2d.shape.basic.Rectangle({
      width: 50,
      height: 50,
      x: 100,
      y: 100,
      bgColor: '#00ee00'
    });
    canvas.add(square);
  }
}
