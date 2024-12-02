import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { UserUpdateType } from '../dto/userUpdateType';
import { Cursor } from '../dto/cursor';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private websocket!: WebSocket;
  private readonly websocketEndpoint = 'http://localhost:8080/canvasUpdatesBroadcast'; // WebSocket URL

  private updateCursorsSubject = new Subject<Cursor[]>();
  private updateNodeSubject = new Subject<{ nodeData: string }>();
  private updateUsersSubject = new Subject<{ username: string; type: UserUpdateType }>();
  private authConfirmedSubject = new Subject<void>();

  updateCursors$ = this.updateCursorsSubject.asObservable();
  updateNode$ = this.updateNodeSubject.asObservable();
  updateUsers$ = this.updateUsersSubject.asObservable();
  authConfirmed$ = this.authConfirmedSubject.asObservable();

  constructor() {}

  connect(url: string, token: string): void {
    this.websocket = new WebSocket(this.websocketEndpoint);

    this.websocket.onopen = () => {
      // console.log('WebSocket connection established');
      this.sendMessage(token.substring(7));
    };

    this.websocket.onmessage = (event) => {
      const message = event.data.toString();
      // console.log('Received message: ', message);

      if (message.startsWith('Welcome ')) {
        this.authConfirmedSubject.next();
      } else if (message.startsWith('S:c=')) {
        // Handle canvas change confirmation
      } else if (message.startsWith('UC')) {
        // Handle UpdateCursors event
        const cursors = this.parseCursorData(message.substring(3));
        this.updateCursorsSubject.next(cursors);
      } else if (message.startsWith('UN')) {
        // Handle UpdateNode event
        const nodeData = message.substring(3);
        this.updateNodeSubject.next({ nodeData });
      } else if (message.startsWith('UU')) {
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

  private parseCursorData(data: string): Cursor[] {
    // Split the data by semicolon to get individual user entries
    const entries = data.split(';');
    
    // Filter out invalid or empty entries and map each valid entry into a Cursor object
    return entries
      .filter(entry => entry.trim() !== '' && entry.includes(',')) // Exclude empty strings and invalid entries
      .map(entry => {
        const [name, x, y] = entry.split(','); // Split each entry by comma
        return {
          name: name.trim(),
          x: parseFloat(x), // Parse x as a float number
          y: parseFloat(y), // Parse y as a float number
        } as Cursor;
      })
      .filter(cursor => !isNaN(cursor.x) && !isNaN(cursor.y)); // Exclude invalid numbers
  }

  sendMessage(message: string): void {
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(message);
      // console.log('Sent message: ', message);
    } else {
      console.error('WebSocket is not open');
    }
  }

  sendCursorUpdate(x: number, y: number) {
    this.sendMessage(`UC:${x},${y}`);
  }

  sendNodeUpdate(nodeData: string) {
    this.sendMessage(`UN:${nodeData}`);
  }

  sendCanvasIdUpdate(canvasID: string): void {
    this.sendMessage(`cId:${canvasID}`);
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      console.log('WebSocket connection closed');
    }
  }
}
