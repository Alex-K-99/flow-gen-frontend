import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private websocket!: WebSocket;
  private readonly websocketEndpoint = 'http://localhost:8080/canvasUpdatesBroadcast'; // WebSocket URL

  constructor() {}

  connect(url :string, token: string): void {
    // Create the WebSocket connection
    this.websocket = new WebSocket(this.websocketEndpoint);

    // Set up event handlers for WebSocket connection
    this.websocket.onopen = () => {
      console.log('WebSocket connection established');
      this.sendMessage(token.substring(7));
    };

    this.websocket.onmessage = (event) => {
      // Handle incoming messages
      console.log('Received message: ', event.data);
      if(event.data.toString().startsWith('Welcome ')) {
        console.log("Successfully authenticated at server!")
      } else if (event.data.toString().startsWith('SUCCESS: c=')) {
        console.log("Successfully changed active canvas to " + event.data.toString().substring(11));
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };

    this.websocket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  // Send a message to the WebSocket server
  sendMessage(message: string): void {
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(message);
      console.log('Sent message: ', message);
    } else {
      console.error('WebSocket is not open');
    }
  }

  sendCursorUpdate(x :number, y :number) {
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send('CP'+x+','+y);
    }
  }

  // Close the WebSocket connection
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      console.log('WebSocket connection closed');
    }
  }
}
