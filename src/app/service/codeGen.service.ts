import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";


const baseUri = environment.backendUrl + '/gen';
@Injectable({
  providedIn: 'root'
})
export class CodeGenService {
  constructor(private httpClient :HttpClient) {
  }

  getSourcesZip(canvasId: number): Observable<Blob> {
    return this.httpClient.get(baseUri + '/' + canvasId, {
      responseType: 'blob', // Ensures the response is treated as binary data
    });
  }
}
