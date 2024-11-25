import {Injectable} from "@angular/core";
import { Subject } from 'rxjs';
import { UserUpdateType } from "../dto/userUpdateType";

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private websocket!: WebSocket;
  private readonly websocketEndpoint = 'http://localhost:8080/canvasUpdatesBroadcast'; // WebSocket URL

  private updateCursorsSubject = new Subject<{cursors: Array<{x :number, y: number, username :string}>}> ();
  private updateNodeSubject = new Subject<{ nodeData: string }>();
  private updateUsersSubject = new Subject<{ username: string; type: UserUpdateType; }>();
  private authConfirmedSubject = new Subject<void>();

  updateCursors$ = this.updateCursorsSubject.asObservable();
  updateNode$ = this.updateNodeSubject.asObservable();
  updateUsers$ = this.updateUsersSubject.asObservable();
  authConfirmed$ = this.authConfirmedSubject.asObservable();

  constructor() {}

  connect(url :string, token: string): void {
this.websocket = new WebSocket(this.websocketEndpoint);

    this.websocket.onopen = () => {
      console.log('WebSocket connection established');
      this.sendMessage(token.substring(7));
    };

    this.websocket.onmessage = (event) => {
      const message = event.data.toString();
      console.log('Received message: ', message);

      if (message.startsWith('Welcome ')) {
        //console.log('Successfully authenticated at server!');
        this.authConfirmedSubject.next();
      } else if (message.startsWith('S:c=')) {
        //console.log('Successfully changed active canvas to ' + message.substring(4));
      } else if (message.startsWith('UC')) {
        // Handle UpdateCursors event
        const cursorData = this.parseCursorUpdate(message.substring(2));
        this.updateCursorsSubject.next({ cursors: cursorData });
      } else if (message.startsWith('UN')) {
        // Handle UpdateNode event
        const nodeData = message.substring(2);
        this.updateNodeSubject.next({ nodeData });
      } else if(message.startsWith('UU')) {
        const username = message.substring(4).split(' ')[0];
          if (message.charAt(2) === 'J') {
            this.updateUsersSubject.next({ username, type: UserUpdateType.JOIN });
          } else if (message.charAt(2) === 'L') {
            this.updateUsersSubject.next({ username, type: UserUpdateType.LEAVE });
          }
      }
    };


    this.websocket.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };

    this.websocket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

private parseCursorUpdate(data: string): Array<{ x: number; y: number; username: string }> {
    return data.split(';').map((item) => {
      const [x, y, username] = item.split(',');
      return { x: +x, y: +y, username };
    });
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
    this.sendMessage('UC:'+x+','+y);
  }

  sendNodeUpdate(nodeData :string) {
    this.sendMessage('UN:${nodeData}');
  }

  sendCanvasIdUpdate(canvasID: string): void {
    this.sendMessage(`cId:${canvasID}`);
  }

  // Close the WebSocket connection
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      console.log('WebSocket connection closed');
    }
  }
}
