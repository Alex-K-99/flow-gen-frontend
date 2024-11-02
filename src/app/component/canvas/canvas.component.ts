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
    //------ Canvas Setup ------------
    const canvasElement = document.querySelector('#canvasContainer');
    // Initialize the draw2d Canvas with the ID of a valid HTML element
    const canvas = canvasElement ? new draw2d.Canvas(canvasElement.id) : null;


    //------- Form Setup -------------
    const form          = <HTMLFormElement>document.querySelector('#node-form');
    const mcid_input    = <HTMLInputElement>document.querySelector('#mcid-input');
    const screenX_input = <HTMLInputElement>document.querySelector('#screenX-input');
    const screenY_input = <HTMLInputElement>document.querySelector('#screenY-input');

    canvasElement?.addEventListener('mouseup', () => {
      const currentNode = canvas.getPrimarySelection();
      if(currentNode) {
        // Handle moved Node
        mcid_input.value = currentNode.id;
        screenX_input.value = currentNode.x;
        screenY_input.value = currentNode.y;
      } else {
        return;
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      // Example: Adding a square to the canvas
      const square = new draw2d.shape.basic.Rectangle({
        id: mcid_input.value,
        width: 50,
        height: 50,
        x: 100,
        y: 100,
        bgColor: '#00ee00'
      });

      // Check if given minecraft ID already exists as a node
      if(!canvas.getFigures().data.find((obj:any) => obj.id === square.id)) {
        this.drawNode(canvas, mcid_input.value, square);
        screenX_input.value = square.x;
        screenY_input.value = square.y;
      } else {
        // Handle duplicates
        return;
      }
      
      
      /*
      Send request with:
      mcid
      coords
      */
      const dataObj = {
        mcid: mcid_input.value,
        screenX: screenX_input.value,
        screenY: screenY_input.value,
      }
      fetch('#', {
        method: 'POST',
        body: JSON.stringify(dataObj),
      })
      .then(response => response.text())
      .then(result => {
        // Handle response
        // console.log(result);
      })
      .catch(er => console.log(er))
    })
  }

  drawNode(canvas :any, mcid :String, shape :Object) :Boolean {
    canvas.add(shape);
    
    return true;
  }
}
