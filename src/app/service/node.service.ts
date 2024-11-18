import { HttpClient, HttpParams } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import {NodeDto} from '../dto/nodeDto';

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
  getAll(): Observable<NodeDto[]> {
    return this.http.get<NodeDto[]>(baseUri);
  }


  getNodesOfCanvas(canvasId :number) :Observable<NodeDto[]> {
      return this.http.get<NodeDto[]>(baseUri + '/ofCanvas/' + canvasId)
  }


  /**
   * Create a new horse in the system.
   *
   * @param node the data for the node that should be created
   * @return an Observable for the created node
   */
  create(node: NodeDto): Observable<NodeDto> {
    return this.http.post<NodeDto>(
      baseUri,
      node
    );
  }

  deleteNode(nodeId: string): Observable<any> {
    return this.http.delete(baseUri + '/' + nodeId);
  }

  updateNode(node: NodeDto, file?: File): Observable<any> {
    const formData = new FormData();

    // Append data to the FormData object
    formData.append('id', node.id.toString());
    if (node.mcId) formData.append('mcId', node.mcId);
    if (file) formData.append('texture', file); // Only add file if provided
    if (node.pattern) formData.append('pattern', node.pattern);
    if (node.screenX !== undefined) formData.append('screenX', node.screenX.toString());
    if (node.screenY !== undefined) formData.append('screenY', node.screenY.toString());

    // Make the HTTP PUT request
    return this.http.put(baseUri, formData);
  }
}
