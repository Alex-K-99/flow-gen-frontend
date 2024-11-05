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

    //--------------------------------
    // canvas.on("select", (emitter:any, event:any) => {
    //   console.log(emitter);
    //   console.log(event);
      
    // })
    //--------------------------------

    fetch("http://localhost:8080/nodes")
    .then(response => response.json())
    .then(result => {
      // console.log(result);
      result.forEach((node :any) => {
        this.drawNode(canvas, node.id, new draw2d.shape.basic.Rectangle({
          width: 50,
          height: 50,
          x: node.screenX,
          y: node.screenY,
          bgColor: '#00ee00',
        }))
      });
      // console.log(document.querySelector("#canvasContainer svg"));
    })
    .catch(er => console.log(er))

    canvasElement?.addEventListener('mouseup', () => {
      const currentNode = canvas.getPrimarySelection();
      if(currentNode) {
        // Handle moved Node
        mcid_input.value = currentNode.id;
        screenX_input.value = currentNode.x;
        screenY_input.value = currentNode.y;

        this.sendRequest("/nodes", "PUT", form);
      } else {
        return;
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      // Example: Adding a square to the canvas
      const square = new draw2d.shape.basic.Rectangle({
        // id: mcid_input.value,
        width: 50,
        height: 50,
        x: 100,
        y: 100,
        bgColor: '#00ee00',
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
      
      
      // Send request with FormData
      this.sendRequest("/nodes", "POST", form);
    })
  }

  drawNode(canvas :any, mcid :String, shape :any) :Boolean {
    // Ports to shape (simple)
    const inputPort = shape.createPort("input");
    const outputPort = shape.createPort("output");


    inputPort.on("connect", (emitterPort:any, connection:any) => {
      // Get StartNode and EndNode when new Connection is created
      const startNode = emitterPort.getConnections().data.pop().sourcePort.parent;
      const endNode = emitterPort.parent;
      
      
      
      
    })
    // for(let i = 0; i < 2; i++) {
    //   shape.createPort("hybrid", new draw2d.layout.locator.InputPortLocator());
    //   shape.createPort("hybrid", new draw2d.layout.locator.OutputPortLocator());
    // }
    shape.id = mcid;

    // console.log(shape.getPorts());
    canvas.add(shape);
    // console.log(canvas.getFigures());
    
    return true;
  }

  sendRequest(endpoint :String, method :string, form :HTMLFormElement) :Boolean {
    fetch(`http://localhost:8080${endpoint}`, {
      method: method,
      body: new FormData(form),
    })
    .then(response => response.text())
    .then(result => {
      // Handle response
      
      console.log(result);
    })
    .catch(er => {
      console.log(er);
      return false;
    })

    return true;
  }
}
