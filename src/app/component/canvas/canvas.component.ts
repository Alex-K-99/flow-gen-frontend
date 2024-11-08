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
    //--------------------------------


    //------- Form Setup -------------
    const form          = <HTMLFormElement>document.querySelector('#node-form');
    const mcid_input    = <HTMLInputElement>document.querySelector('#mcid-input');
    const screenX_input = <HTMLInputElement>document.querySelector('#screenX-input');
    const screenY_input = <HTMLInputElement>document.querySelector('#screenY-input');

    const delete_button = <HTMLButtonElement>document.querySelector('#delete-button');


    //-------- Placeholder Texture ---
    const placeholderPath = '/assets/resources/placeholder_texture.png';

    // Get all Nodes
    fetch("http://localhost:8080/nodes")
      .then(response => response.json())
      .then(result => {
        result.forEach((node: any) => {
          // Check if texture is available, otherwise use placeholder
          const texturePath = node.texture
            ? 'data:image/png;base64,' + node.texture
            : placeholderPath;

          const shape = new draw2d.shape.basic.Image({
            id: node.id,
            width: 48,
            height: 48,
            x: node.screenX,
            y: node.screenY,
            path: texturePath,
            resizeable: false,
            cssClass: 'pixelated'
          });

          this.drawNode(canvas, node.mcId, shape);
        });
      })
      .catch(er => console.log(er));

    // Get all Edges
    fetch("http://localhost:8080/edges/-1")
    .then(response => response.json())
    .then(result => {
      console.log(result);

      result.forEach((connection :any) => {
        const con = new draw2d.Connection();
        con.id = connection.id;
        con.setSource(connection.from.getOutputPort(0));
        con.setSource(connection.to.getInputPort(0));
        canvas.add(con);
      });
    })
    .catch(er => console.log(er));

    canvasElement?.addEventListener('mouseup', () => {
      const currentNode = canvas.getPrimarySelection();
      // Handle moved Node
      console.log(currentNode);

      if(currentNode && currentNode.cssClass !== "draw2d_shape_basic_Label") {
        // Enable deleteButton
        delete_button.disabled = false;
      }

      // Exception for moving Labels and Connections
      if(currentNode && currentNode.cssClass !== "draw2d_shape_basic_Label" && currentNode.cssClass !== "draw2d_Connection") {

        // Get name of node from Label
        mcid_input.value = currentNode.children.data[0].figure.text;

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

    delete_button?.addEventListener('click', () => {
      const selectedNode = canvas.getPrimarySelection();
      let endpoint :string;

      if(selectedNode.cssClass === "draw2d_Connection") {
        endpoint = "/edges";
      } else {
        endpoint = "/nodes";
      }

      this.deleteNode(form, delete_button, canvas, selectedNode, endpoint);
    })

    form.addEventListener('submit', e => {
      e.preventDefault();
      // Example: Adding a square to the canvas
      const shape = new draw2d.shape.basic.Image({
        // id: mcid_input.value,
        width: 50,
        height: 50,
        x: 100,
        y: 100,
        path: placeholderPath,
        cssClass: 'pixelated',
      });



      // Fill form inputs before constructing new FormData to make sure that no error is in result
      screenX_input.value = shape.x;
      screenY_input.value = shape.y;

      const formData = new FormData(form);
      // Temporary Hardcode
      formData.append("canvasId", "-1");
      // -------------------

      fetch(`http://localhost:8080/nodes`, {
        method: "POST",
        body: formData,
      })
      .then(response => response.json())
      .then(result => {
        console.log(result);
        
        // Check if given minecraft ID already exists as a node
        if(!canvas.getFigures().data.find((obj:any) => obj.children.data[0].figure.text === mcid_input.value)) {
          // figure.cssClass = "pixelated";
          this.drawNode(canvas, mcid_input.value, shape, result.id);
        } else {
          // Handle duplicates
          alert(`The Node "${mcid_input.value}" already exists! Idiot...`)
          return;
        }

      })
      .catch(er => {
        console.log(er);
        return false;
      })
    })
  }

  drawNode(canvas: any, mcId: any, shape: any, shapeId: any = null): Boolean {
    // Ports to shape (simple)
    const inputPort = shape.createPort("input");
    const outputPort = shape.createPort("output");

    inputPort.on("connect", (emitterPort: any, connection: any) => {
      connection.connection.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator());

      let label = new draw2d.shape.basic.Label({
        text: 0,
      });
      label.installEditor(new draw2d.ui.LabelEditor());

      connection.connection.add(label, new draw2d.layout.locator.ManhattanMidpointLocator());

      const startNode = emitterPort.getConnections().data.pop().sourcePort.parent;
      const endNode = emitterPort.parent;

      const formData = new FormData();
      formData.append("from", startNode.id);
      formData.append("to", endNode.id);
      formData.append("amount", "1"); // Temporary hardcoded value
      formData.append("canvasId", "-1");

      fetch(`http://localhost:8080/edges`, {
        method: "POST",
        body: formData,
      })
      .then(response => response.json())
      .then(result => {
        // Handle response
        connection.connection.id = result.id;
      })
      .catch(er => {
        console.log(er);
      })
      // this.sendRequest("/edges", "POST", formData);
    });

    if (shapeId) {
      shape.id = shapeId;
    }

    shape.add(new draw2d.shape.basic.Label({
      text: mcId,
      x: 0,
      y: -25
    }), new draw2d.layout.locator.DraggableLocator());

    canvas.add(shape);

    return true;
  }

  deleteNode(form :HTMLFormElement, btn :HTMLButtonElement, canvas :any, node :any, endpoint :string) :Boolean {
    let command = new draw2d.command.CommandDelete(node);
    canvas.getCommandStack().execute(command);

    const formData = new FormData();
    formData.append("id", node.id);

    this.sendRequest(endpoint, "DELETE", formData);

    // Clear form
    form.reset();

    // Disable Delete Button
    btn.disabled = true;

    return true;


  }

  sendRequest(endpoint :String, method :string, formData :FormData) :Boolean {
    fetch(`http://localhost:8080${endpoint}`, {
      method: method,
      body: formData,
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
