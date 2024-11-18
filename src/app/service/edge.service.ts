import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import { HttpClient, HttpParams } from '@angular/common/http';
import {Observable} from 'rxjs';
import {Canvas} from "../dto/canvas";
import {Edge} from "../dto/edge";

const baseUri = environment.backendUrl + '/edges';
@Injectable({
  providedIn: 'root'
})
export class EdgeService {

  constructor(private httpClient :HttpClient) {
  }

  getEdgesOfCanvas(canvasId :number) :Observable<Edge[]> {
    return this.httpClient.get<Edge[]>(baseUri + '/ofCanvas/' + canvasId)
  }

  delete(id: number): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());

    const options = {
      body: formData,
    };

    return this.httpClient.request('DELETE', `${baseUri}`, options);
  }

  create(formData: FormData) :Observable<Edge> {
    return this.httpClient.post<Edge>(baseUri, formData);
  }
}
