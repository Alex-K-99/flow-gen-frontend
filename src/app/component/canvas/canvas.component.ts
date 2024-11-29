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
import { Cursor } from 'src/app/dto/cursor';

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
  private currentNodeState: Map<number, NodeDto> = new Map();

  constructor(
    private route: ActivatedRoute,
    private nodeService :NodeService,
    private edgeService :EdgeService,
    private codeGenService :CodeGenService,
    private websocketService :WebsocketService,
    private authService :AuthService,
  ) {
  }

  private subscriptions: Subscription = new Subscription();
  private activeCursors :Cursor[] = [];
  private canvas!: any;

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
          this.websocketService.updateCursors$.subscribe((cursorList) => {
            //console.log('Cursor positions updated:', cursorList);
            this.updateActiveCursors(cursorList);
          })
        );

        // Subscribe to UpdateNode event
        this.subscriptions.add(
          this.websocketService.updateNode$.subscribe((data) => {
            console.log('Node data updated:', data.nodeData);
            this.handleNodeUpdate(JSON.parse(data.nodeData));
          })
        );

        this.subscriptions.add(
          this.websocketService.updateUsers$.subscribe(({ type, username }) => {
            if (type === UserUpdateType.JOIN) {
              console.log(`${username} has joined.`);
            } else if (type === UserUpdateType.LEAVE) {
              this.removeActiveCursor(username);
              console.log(`${username} has left.`);
            }
          })
        );
      }
  }

  ngAfterViewInit() {
    //------ Canvas Setup ------------
    const canvasElement = document.querySelector('#canvasContainer') as HTMLElement;
    // Initialize the draw2d Canvas with the ID of a valid HTML element
    if (canvasElement) {
      this.canvas = new draw2d.Canvas(canvasElement.id);
    }
    const canvasId = this.route.snapshot.paramMap.get('id');
    if (canvasId) {
      this.loadNodes(Number(canvasId));
      this.getAndRenderEdges(Number(canvasId), this.canvas);
    }
    //--------------------------------

    //------- Form Setup -------------
    const form = <HTMLFormElement>document.querySelector('#node-form');
    const mcid_input = <HTMLInputElement>document.querySelector('#mcid-input');
    const screenX_input = <HTMLInputElement>document.querySelector('#screenX-input');
    const screenY_input = <HTMLInputElement>document.querySelector('#screenY-input');
    const delete_button = <HTMLButtonElement>document.querySelector('#delete-button');


    // Render Canvas
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
        this.loadNodes(Number(canvasId));
        this.getAndRenderEdges(canvasIdNum, this.canvas);


        canvasElement?.addEventListener('mouseup', () => {
          const updatedNode = this.canvas.getPrimarySelection();
          if (!updatedNode || updatedNode.cssClass === "draw2d_shape_basic_Label" || updatedNode.cssClass === "draw2d_Connection") {
            return; // Ignore labels and connections
          }
        
          // Prepare the current node's data
          const updatedNodeData: NodeDto = {
            id: updatedNode.id,
            mcId: updatedNode.children.data[0]?.figure.text || '',
            pattern: null,
            screenX: updatedNode.x,
            screenY: updatedNode.y,
            texture: null
          };
        
          // Retrieve the current state
          const currentState = this.currentNodeState.get(updatedNode.id);
        
          // Detect changes
          const changes: Partial<NodeDto> = {};
          if (!currentState || currentState.mcId !== updatedNodeData.mcId) {
            changes.mcId = updatedNodeData.mcId;
          }
          if (!currentState || currentState.screenX !== updatedNodeData.screenX) {
            changes.screenX = updatedNodeData.screenX;
          }
          if (!currentState || currentState.screenY !== updatedNodeData.screenY) {
            changes.screenY = updatedNodeData.screenY;
          }
        
          // If there are changes, send an update via WebSocket
          if (Object.keys(changes).length > 0) {
            changes.id = updatedNodeData.id; // Always include the node ID
            const messageString = `${JSON.stringify(changes)}`;
            this.websocketService.sendNodeUpdate(messageString);

            this.nodeService.updateNode(updatedNodeData).subscribe();
        
            // Update the previous state with the current state
            this.currentNodeState.set(updatedNode.id,  updatedNodeData);
          }
        });

        delete_button?.addEventListener('click', () => {
          const selectedNode = this.canvas.getPrimarySelection();
          let endpoint: string;

          if (selectedNode.cssClass === "draw2d_Connection") {
            endpoint = "/edges";
          } else {
            endpoint = "/nodes";
          }

          this.deleteNode(form, delete_button, this.canvas, selectedNode, endpoint);
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
              if (!this.canvas.getFigures().data.find((obj: any) => obj.children.data[0].figure.text === mcid_input.value)) {
                // figure.cssClass = "pixelated";
                this.drawNode(this.canvas, mcid_input.value, shape, data.id);
              } else {
                // Handle duplicates
                alert(`The Node "${mcid_input.value}" already exists! Idiot...`)
                return;
              }
            }
          });
        })
      }
    }
  }

  loadNodes(canvasId :number) {
    //this.logCurrentNodesList();
    this.currentNodeState.clear();
    this.nodeService.getNodesOfCanvas(canvasId).subscribe({
      next: data => {
        data.forEach(node => {
          console.log('Adding node to current nodes: ' + JSON.stringify(node))
          this.currentNodeState.set(node.id, node);
        })
        //this.logCurrentNodesList();
        this.renderNodes(this.canvas);
      }
    });
  }

  private renderNodes(canvas: any): void {
    // Clear the canvas before rendering
    canvas.clear();
  
    // Iterate over the current state and render all nodes
    this.currentNodeState.forEach((node) => {
      const texturePath = node.texture
        ? `data:image/png;base64,${node.texture}`
        : this.placeholderPath;
  
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
  
      this.drawNode(canvas, node.mcId, shape, node.id);
    });
  
    // Re-render all edges
    this.getAndRenderEdges(Number(this.route.snapshot.paramMap.get('id')), canvas);
  }

  private getAndRenderEdges(canvasIdNum: number, canvas: any | null) {
    if (!canvas) {
      console.error("Canvas is null. Cannot render edges.");
      return;
    }
    // Get all Edges
    this.edgeService.getEdgesOfCanvas(canvasIdNum).subscribe({
      next: (edges) => {
        if (edges && edges.length > 0) {
          // console.log(edges);

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
                con.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator());
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

  drawNode(canvas: any, mcId: any, shape: any, shapeId: any = null): Boolean {
    // Ports to shape (simple)
    const inputPort = shape.createPort("input");
    const outputPort = shape.createPort("output");

    /* 
    Slightly delay when the ports get der eventListeners/eventHandlers to prevent the Event from triggering Requests on initial load
    This obviously is a bad and temporary solution so please burn me at the stake
    */
    setTimeout(() => {
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
        const canvasId = this.route.snapshot.paramMap.get('id');
        const edge :Edge = {
          id: 0,
          nodeFrom: endNode.id,
          nodeTo: startNode.id,
          amount: 1,
          canvasId: Number(canvasId),
        }
        
        this.edgeService.postEdge(edge).subscribe();
        });
      }, 500);
    //----------------------------------------------------------------------------------------------------

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
    // Clear form
    form.reset();

    // Disable Delete Button
    btn.disabled = true;

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

  private updateActiveCursors(newCursors: Cursor[]): void {
    newCursors.forEach(newCursor => {
      // Find the index of the existing cursor with the same username
      const existingCursorIndex = this.activeCursors.findIndex(
        cursor => cursor.name === newCursor.name
      );
  
      if (existingCursorIndex !== -1) {
        // If the cursor exists, update its position
        this.activeCursors[existingCursorIndex] = newCursor;
      } else {
        // If the cursor doesn't exist, add it to the array
        this.activeCursors.push(newCursor);
      }
    });
  
    // Optionally, log the updated state for debugging
    console.log('Updated active cursors:', this.activeCursors);
  }

  private removeActiveCursor(username: string): void {
    // Filter out the cursor with the matching username
    this.activeCursors = this.activeCursors.filter(cursor => cursor.name !== username);
  
    // Optionally log the updated state for debugging
    console.log('Updated active cursors after removal:', this.activeCursors);
  }

  private handleNodeUpdate(updatedNode: NodeDto): void {
    // Update the node in the state map
    this.currentNodeState.set(updatedNode.id, updatedNode);
  
    // Get the canvas
    const canvasElement = document.querySelector('#canvasContainer') as HTMLElement;
    if (!canvasElement) return;
  
    // Clear the node and its dependencies (edges)
    const canvas = this.canvas; // Use the initialized `draw2d` canvas
    const existingNode = canvas.getFigure(updatedNode.id);
  
    if (existingNode) {
      // Remove node and its edges
      existingNode.getConnections().data.forEach((connection: any) => canvas.remove(connection));
      canvas.remove(existingNode);
    }
    // Re-render the updated node
    const texturePath = updatedNode.texture
        ? `data:image/png;base64,${updatedNode.texture}`
        : this.placeholderPath;

    const newNodeShape = new draw2d.shape.basic.Image({
      id: updatedNode.id,
      width: 48,
      height: 48,
      x: updatedNode.screenX,
      y: updatedNode.screenY,
      path: texturePath,
      resizeable: false,
      cssClass: 'pixelated',
    });

    this.drawNode(canvas, updatedNode.mcId, newNodeShape, updatedNode.id);

    // Re-render the edges connected to this node
    this.renderEdgesForNode(updatedNode.id);
  }

private renderEdgesForNode(nodeId: number): void {
  const canvas = this.canvas;

  // Find edges where this node is the source or target
  this.edgeService.getEdgesOfCanvas(Number(this.route.snapshot.paramMap.get('id')))
    .subscribe((edges: Edge[]) => {
      edges.forEach((edge) => {
        if (edge.nodeFrom === nodeId || edge.nodeTo === nodeId) {
          const sourceNode = canvas.getFigure(edge.nodeFrom);
          const targetNode = canvas.getFigure(edge.nodeTo);

          if (sourceNode && targetNode) {
            const sourcePort = sourceNode.getOutputPort(0);
            const targetPort = targetNode.getInputPort(0);

            if (sourcePort && targetPort) {
              const connection = new draw2d.Connection();
              connection.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator());
              connection.id = edge.id;
              if(this.canvas) {
                connection.setSource(sourcePort);
                connection.setTarget(targetPort);
                canvas.add(connection);
              }
            }
          }
        }
      });
    });
  }
}
