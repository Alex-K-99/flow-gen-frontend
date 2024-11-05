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
    
    // console.log(canvasElement?.id);
    

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
      console.log(result);
      result.forEach((node :any) => {
        this.drawNode(canvas, node.id, new draw2d.shape.basic.Rectangle({
          id: node.id,
          width: 50,
          height: 50,
          x: node.screenX,
          y: node.screenY,
          bgColor: '#00ee00',
        }))

        canvas.getFigures().data.forEach((element:any) => {
          if(node.id === element.id) {
            element.add(new draw2d.shape.basic.Label({
              id: `Label for ${node.mcId}`,
              text: node.mcId, 
              x: 0, 
              y: -25
            }), new draw2d.layout.locator.DraggableLocator());
          }
        });

      });
      // console.log(document.querySelector("#canvasContainer svg"));
      // match.add(new draw2d.shape.basic.Label({
      //   text: element.mcId, 
      //   x: 0, 
      //   y: 0
      // }), new draw2d.layout.locator.DraggableLocator());
    })
    .catch(er => console.log(er))

    canvasElement?.addEventListener('mouseup', () => {
      const currentNode = canvas.getPrimarySelection();
      if(currentNode) {
        // Handle moved Node
        mcid_input.value = currentNode.id;
        screenX_input.value = currentNode.x;
        screenY_input.value = currentNode.y;

        const formData = new FormData();
        formData.append("id", currentNode.id);
        formData.append("screenX", currentNode.x);
        formData.append("screenY", currentNode.y);


        this.sendRequest("/nodes", "PUT", formData);
        
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
        bgColor: '#00ee00',
      });

      // ---------------- not currently working --------------------------
      // Check if given minecraft ID already exists as a node
      if(!canvas.getFigures().data.find((obj:any) => obj.id === square.id)) {
        this.drawNode(canvas, square.id, square);
        screenX_input.value = square.x;
        screenY_input.value = square.y;
      } else {
        // Handle duplicates
        return;
      }
      //-------------------------------------------------------------------
      
      const formData = new FormData(form);
      // Temporary Hardcode
      formData.append("canvasId", "-1");
      
      
      // Send request with FormData
      this.sendRequest("/nodes", "POST", formData);
    })
  }

  drawNode(canvas :any, mcid :any, shape :any) :Boolean {
    // Ports to shape (simple)
    const inputPort = shape.createPort("input");
    const outputPort = shape.createPort("output");


    inputPort.on("connect", (emitterPort:any, connection:any) => {
      // Add arrow Decorator
      connection.connection.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator());
      connection.connection.add(new draw2d.shape.basic.Label({
        text: 0,
      }), new draw2d.layout.locator.ManhattanMidpointLocator());
      // console.log(connection.connection);
      

      // Get StartNode and EndNode when new Connection is created
      const startNode = emitterPort.getConnections().data.pop().sourcePort.parent;
      const endNode = emitterPort.parent;

      const formData = new FormData();
      formData.append("from", startNode.id);
      formData.append("to", endNode.id);

      // Temporary Hardcode-------
      formData.append("amount", "1");
      formData.append("canvasId", "-1");
      //--------------------------
      
      this.sendRequest("/edges", "POST", formData)
    })
    shape.id = mcid;
    
    canvas.add(shape);

    // Apply Labels (könnt besser gehn)
    // fetch("http://localhost:8080/nodes")
    // .then(response => response.json())
    // .then(res => {
    //   console.log(res);

      
    //   // res.forEach((element:any) => {
    //   //   let match = canvas.getFigures().data.find((obj:any) => obj.id === element.id);
    //   //   if(match) {
    //   //     match.add(new draw2d.shape.basic.Label({
    //   //       text: element.mcId, 
    //   //       x: 0, 
    //   //       y: 0
    //   //     }), new draw2d.layout.locator.DraggableLocator());
    //   //   }

    //   // });
    // })
    // .catch(er => console.log(er));


    // console.log(canvas.getFigures());
    
    return true;
  }

  sendRequest(endpoint :String, method :string, formData :FormData) :Boolean {
    fetch(`http://localhost:8080${endpoint}`, {
      method: method,
      body: formData,
    })
    .then(response => response.json())
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
