import { Component, ElementRef, AfterViewInit, ViewChild, Input } from '@angular/core';
import * as $ from 'jquery'; // Import jQuery with correct types
import {ActivatedRoute} from "@angular/router";
import {NodeService} from "../../service/node.service";
import {EdgeService} from "../../service/edge.service";
import {Edge} from "../../dto/edge";
import draw2d from "draw2d";
import {NodeDto} from "../../dto/nodeDto";

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef;

  private placeholderPath = '/assets/resources/placeholder_texture.png';

  constructor(
    private route: ActivatedRoute,
    private nodeService :NodeService,
    private edgeService :EdgeService,
  ) {
  }

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


    // Get all Nodes
    const canvasId = this.route.snapshot.paramMap.get('id');
    if(canvasId) {
      const canvasIdNum = Number(canvasId);

      this.getAndRenderNodes(canvasId, this.placeholderPath, canvas);
      this.getAndRenderEdges(canvasIdNum, canvas);

      canvasElement?.addEventListener('mouseup', () => {
        const currentNode = canvas.getPrimarySelection();
        // Handle moved Node
        console.log(currentNode);

        if (currentNode && currentNode.cssClass !== "draw2d_shape_basic_Label") {
          // Enable deleteButton
          delete_button.disabled = false;
        }

        // Exception for moving Labels and Connections
        if (currentNode && currentNode.cssClass !== "draw2d_shape_basic_Label" && currentNode.cssClass !== "draw2d_Connection") {

          // Get name of node from Label
          mcid_input.value = currentNode.children.data[0].figure.text;

          screenX_input.value = currentNode.x;
          screenY_input.value = currentNode.y;

          const texture = null;
          const editedNode :NodeDto = new class implements NodeDto {
            id: number = currentNode.id;
            mcId: string = mcid_input.value;
            pattern: null = null;
            screenX: number = currentNode.x;
            screenY: number = currentNode.y;
            texture: string | null = texture;
          }

          this.nodeService.updateNode(editedNode).subscribe();
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
        path: this.placeholderPath,
        cssClass: 'pixelated',
      });



      // Fill form inputs before constructing new FormData to make sure that no error is in result
      screenX_input.value = shape.x;
      screenY_input.value = shape.y;

      const formData = new FormData(form);
      // Temporary Hardcode
      formData.append("canvasId", canvasId);
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
  }

  private getAndRenderEdges(canvasIdNum: number, canvas: any | null) {
    // Get all Edges
    this.edgeService.getEdgesOfCanvas(canvasIdNum).subscribe({
      next: (edges) => {
        if (edges && edges.length > 0) {
          console.log(edges);

          edges.forEach((edge: Edge) => {
            // Find the source and target nodes on the canvas by their IDs
            const sourceNode = canvas.getFigure(edge.nodeFrom);
            const targetNode = canvas.getFigure(edge.nodeTo);

            if (sourceNode && targetNode) {
              // Get the ports
              const sourcePort = sourceNode.getOutputPort(0); // Adjust index or port name as needed
              const targetPort = targetNode.getInputPort(0);

              if (sourcePort && targetPort) {
                // Create and configure the connection
                const con = new draw2d.Connection();
                con.id = edge.id;
                con.setSource(sourcePort);
                con.setTarget(targetPort);
                canvas.add(con);
              } else {
                console.warn(
                  `Ports not found for nodes: ${edge.nodeFrom} -> ${edge.nodeTo}`
                );
              }
            } else {
              console.warn(
                `Nodes not found on canvas: ${edge.nodeFrom} -> ${edge.nodeTo}`
              );
            }
          });
        }
      },
      error: (error) => {
        console.error("Failed to load edges:", error);
      }
    });
  }

  private getAndRenderNodes(canvasId: string, placeholderPath: string, canvas: any | null) {
    this.nodeService.getNodesOfCanvas(Number(canvasId)).subscribe({
      next: (nodes) => {
        if (nodes && nodes.length > 0) {
          nodes.forEach((node) => {
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
              cssClass: 'pixelated',
            });
            this.drawNode(canvas, node.mcId, shape);
          })

        }
      }
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

  initializeCanvasEventHandlers(canvasElement: Element, canvas: any, delete_button: HTMLButtonElement, mcid_input: HTMLInputElement, screenX_input: HTMLInputElement, screenY_input: HTMLInputElement): void {
    canvasElement?.addEventListener('mouseup', () => {
      const currentNode = canvas.getPrimarySelection();

      // Handle moved Node
      console.log(currentNode);

      if (currentNode && currentNode.cssClass !== "draw2d_shape_basic_Label") {
        // Enable delete button
        delete_button.disabled = false;
      }

      // Exception for moving Labels and Connections
      if (currentNode && currentNode.cssClass !== "draw2d_shape_basic_Label" && currentNode.cssClass !== "draw2d_Connection") {
        // Update input fields
        mcid_input.value = currentNode.children.data[0].figure.text;
        screenX_input.value = currentNode.x;
        screenY_input.value = currentNode.y;

        // Call the service to update the node's position
        this.nodeService.updateNode(currentNode).subscribe({
          next: (response) => {
            console.log("Node position updated successfully:", response);
          },
          error: (err) => {
            console.error("Failed to update node position:", err);
          }
        });
      } else {
        return;
      }
    });
  }

  initializeCanvasEvents(canvasElement: HTMLElement, canvas: any, form: HTMLFormElement, deleteButton: HTMLButtonElement, mcidInput: HTMLInputElement, screenXInput: HTMLInputElement, screenYInput: HTMLInputElement): void {
    const canvasId = canvas.id;
    const handleMouseUp = () => {
      const currentNode = canvas.getPrimarySelection();
      if (!currentNode) return;

      console.log(currentNode);

      // Enable delete button if node is not a label
      deleteButton.disabled = currentNode.cssClass === "draw2d_shape_basic_Label";

      // Update node position if it's not a label or connection
      if (currentNode.cssClass !== "draw2d_shape_basic_Label" && currentNode.cssClass !== "draw2d_Connection") {
        this.updateNodeFormInputs(mcidInput, screenXInput, screenYInput, currentNode);

        this.nodeService.updateNode(
          currentNode
        ).subscribe({
          next: () => console.log("Node position updated successfully"),
          error: (err) => console.error("Failed to update node position:", err),
        });
      }
    };

    const handleDeleteClick = () => {
      const selectedNode = canvas.getPrimarySelection();
      if (!selectedNode) return;

      const endpoint = selectedNode.cssClass === "draw2d_Connection" ? "/edges" : "/nodes";
      this.nodeService.deleteNode(selectedNode.id).subscribe({
        next: () => {
          canvas.remove(selectedNode);
          deleteButton.disabled = true;
        },
        error: (err) => console.error("Failed to delete node/connection:", err),
      });
    };

    const handleFormSubmit = (e: Event) => {
      e.preventDefault();

      // Map form inputs to a Node object
      const newNode: NodeDto = {
        id: 0,
        mcId: mcidInput.value,
        screenX: parseInt(screenXInput.value, 10),
        screenY: parseInt(screenYInput.value, 10),
        pattern: null,
        texture: this.placeholderPath, // Set texture or default value
      };

      const shape = new draw2d.shape.basic.Image({
        id: newNode.id,
        width: 48,
        height: 48,
        x: newNode.screenX,
        y: newNode.screenY,
        path: this.placeholderPath,
        resizeable: false,
        cssClass: 'pixelated',
      });

      // Update form inputs
      this.updateNodeFormInputs(mcidInput, screenXInput, screenYInput, shape);

      // Prepare form data
      const formData = new FormData(form);
      formData.append("canvasId", canvasId);
      this.nodeService.create(newNode).subscribe({
        next: (result) => {
          if (!canvas.getFigures().data.some((obj: any) => obj.children.data[0].figure.text === mcidInput.value)) {
            this.drawNode(canvas, mcidInput.value, shape, result.id);
          } else {
            alert(`The Node "${mcidInput.value}" already exists!`);
          }
        },
        error: (err) => console.error("Failed to add node:", err),
      });
    };

    // Add consolidated event listeners
    canvasElement?.addEventListener("mouseup", handleMouseUp);
    deleteButton?.addEventListener("click", handleDeleteClick);
    form?.addEventListener("submit", handleFormSubmit);
  }

  private updateNodeFormInputs(mcidInput: HTMLInputElement, screenXInput: HTMLInputElement, screenYInput: HTMLInputElement, node: any): void {
    mcidInput.value = node.children?.data[0]?.figure?.text || "";
    screenXInput.value = node.x;
    screenYInput.value = node.y;
  }
}
