import { Component, ElementRef, AfterViewInit, ViewChild, Input } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {NodeService} from "../../service/node.service";
import {EdgeService} from "../../service/edge.service";
import {Edge} from "../../dto/edge";
import draw2d from "draw2d";
import {NodeDto} from "../../dto/nodeDto";
import {CodeGenService} from "../../service/codeGen.service";
import {AuthService} from "../../service/auth.service";
import {WebsocketService} from "../../service/websocket.service";
import {fromEvent, throttleTime, Subscription} from "rxjs";
import { UserUpdateType } from 'src/app/dto/userUpdateType';

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
    private codeGenService :CodeGenService,
    private websocketService :WebsocketService,
    private authService :AuthService,
  ) {
  }

  private cursorPosition = { x: 0, y: 0 };
  private isMouseOverCanvas = false;
  private intervalId: any = null; // To store the interval ID
  private subscriptions: Subscription = new Subscription();

    ngOnDestroy(): void {
      // Clean up subscriptions and disconnect WebSocket
      this.subscriptions.unsubscribe();
      this.websocketService.disconnect();
    }

  ngOnInit() :void {
    const authToken = this.authService.getAuthToken();
    if(authToken)
      this.websocketService.connect('http://localhost:8080/canvasUpdatesBroadcast', authToken);

    const canvasId = this.route.snapshot.paramMap.get('id');
        if (canvasId) {
    //Subscribe to UpdateCursors event

       this.subscriptions.add(
          this.websocketService.authConfirmed$.subscribe(() => {
            //console.log('Authenticated successfully. Sending current canvas ID:', canvasId);
            this.websocketService.sendCanvasIdUpdate(canvasId);
          })
        );
        this.subscriptions.add(
          this.websocketService.updateCursors$.subscribe((data) => {
            console.log('Cursor positions updated:', data.cursors);
          })
        );

        // Subscribe to UpdateNode event
        this.subscriptions.add(
          this.websocketService.updateNode$.subscribe((data) => {
            console.log('Node data updated:', data.nodeData);
          })
        );

        this.subscriptions.add(
          this.websocketService.updateUsers$.subscribe(({ type, username }) => {
            if (type === UserUpdateType.JOIN) {
              console.log(`${username} has joined.`);
            } else if (type === UserUpdateType.LEAVE) {
              console.log(`${username} has left.`);
            }
          })
        );
      }
  }

  ngAfterViewInit(): void {
    //------ Canvas Setup ------------
    const canvasElement = document.querySelector('#canvasContainer') as HTMLElement;
    // Initialize the draw2d Canvas with the ID of a valid HTML element
    const canvas = canvasElement ? new draw2d.Canvas(canvasElement.id) : null;
    //--------------------------------




    //------- Form Setup -------------
    const form = <HTMLFormElement>document.querySelector('#node-form');
    const mcid_input = <HTMLInputElement>document.querySelector('#mcid-input');
    const screenX_input = <HTMLInputElement>document.querySelector('#screenX-input');
    const screenY_input = <HTMLInputElement>document.querySelector('#screenY-input');

    const delete_button = <HTMLButtonElement>document.querySelector('#delete-button');



    // Get all Nodes
    const canvasId = this.route.snapshot.paramMap.get('id');
    if (canvasId) {
      const canvasIdNum = Number(canvasId);
      const authToken = this.authService.getAuthToken();
      if (authToken) {
        if(canvasElement) {
          fromEvent<MouseEvent>(canvasElement, 'mousemove')
            .pipe(throttleTime(250))
            .subscribe((event :MouseEvent) => {
              this.handleMouseMoveEvent(event, canvasElement);
            });
        }

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
            const editedNode: NodeDto = new class implements NodeDto {
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
          let endpoint: string;

          if (selectedNode.cssClass === "draw2d_Connection") {
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
          formData.append("canvasId", canvasId);
          // -------------------
          this.nodeService.createFromForm(formData).subscribe({
            next: data => {
              if (!canvas.getFigures().data.find((obj: any) => obj.children.data[0].figure.text === mcid_input.value)) {
                // figure.cssClass = "pixelated";
                this.drawNode(canvas, mcid_input.value, shape, data.id);
              } else {
                // Handle duplicates
                alert(`The Node "${mcid_input.value}" already exists! Idiot...`)
                return;
              }
            }
          });
          /*fetch(`http://localhost:8080/nodes`, {
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
          })*/
        })
      }
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

      //TODO: fix this part so edges can be created again without doing so when loading a canvas
      const startNode = emitterPort.getConnections().data.pop().sourcePort.parent;
      const endNode = emitterPort.parent;

      /*const formData = new FormData();
      formData.append("from", startNode.id);
      formData.append("to", endNode.id);
      formData.append("amount", "1"); // Temporary hardcoded value
      formData.append("canvasId", "-1");*/
      const canvasId = this.route.snapshot.paramMap.get('id');
      const edge :Edge = {
        id: 0,
        nodeFrom: endNode.id,
        nodeTo: startNode.id,
        amount: 1,
        canvasId: Number(canvasId),
      }

      this.edgeService.postEdge(edge).subscribe();
      /*fetch(`http://localhost:8080/edges`, {
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
      })*/
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
    if(endpoint === '/nodes') {
      this.nodeService.delete(node.id).subscribe();
    } else {
      this.edgeService.deleteEdge(node.id).subscribe();
    }
    //this.sendRequest(endpoint, "DELETE", formData);

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

  getCanvasDocumentCoordinates(canvas :HTMLElement): { y: number; x: number; width: number; height: number } | null {
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      return {
        y: Math.round(rect.top + scrollTop),  // Top coordinate relative to the document
        x: Math.round(rect.left + scrollLeft), // Left coordinate relative to the document
        width: Math.round(rect.width),          // Width of the canvas
        height: Math.round(rect.height),        // Height of the canvas
      };
    }

    return null; // Handle cases where the canvas element might not yet exist
  }

  generateSources(): void {
    const canvasId = this.route.snapshot.paramMap.get('id');
    this.codeGenService.getSourcesZip(Number(canvasId)).subscribe({
      next: (zipFile: Blob) => {
        const blobUrl = URL.createObjectURL(zipFile);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `canvas_${canvasId}_sources.zip`; // Desired file name
        link.click();
        URL.revokeObjectURL(blobUrl); // Clean up the object URL
      },
      error: (err) => {
        console.error('Failed to download ZIP file:', err);
      },
    });
  }

  private handleMouseMoveEvent(event :MouseEvent,canvasElement :HTMLElement) {
    let canPos = this.getCanvasDocumentCoordinates(canvasElement);
    if(canPos) {
      this.websocketService.sendCursorUpdate(event.x - canPos.x, event.y - canPos.y)
    }

  }
}
