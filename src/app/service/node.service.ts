import { HttpClient, HttpParams } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import {Node} from '../dto/node';

const baseUri = environment.backendUrl + '/nodes';

@Injectable({
  providedIn: 'root'
})
export class NodeService {

  constructor(
    private http: HttpClient,
  ) { }

  /**
   * Get all horses stored in the system
   *
   * @return observable list of found horses.
   */
  getAll(): Observable<Node[]> {
    return this.http.get<Node[]>(baseUri);
  }


  getNodesOfCanvas(canvasId :number) :Observable<Node[]> {
      return this.http.get<Node[]>(baseUri + '/ofCanvas/' + canvasId)
  }


  /**
   * Create a new horse in the system.
   *
   * @param node the data for the node that should be created
   * @return an Observable for the created node
   */
  create(node: Node): Observable<Node> {
    return this.http.post<Node>(
      baseUri,
      node
    );
  }
}
