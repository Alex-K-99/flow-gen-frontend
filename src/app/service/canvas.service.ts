import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import { HttpClient, HttpParams } from '@angular/common/http';
import {Observable} from 'rxjs';
import {Canvas} from "../dto/canvas";

const baseUri = environment.backendUrl + '/canvases';
@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  constructor(private httpClient :HttpClient) {
  }

  getCanvasesOfUser() :Observable<Canvas[]> {
    return this.httpClient.get<Canvas[]>(baseUri,
      )
  }

  create(canvasData: { name: string; modClass: string; packageBase: string }, userId :number, sessionId :string) :Observable<Canvas> {
    return this.httpClient.post<Canvas>(baseUri + '?userId=' + userId + '&sessionId=' + sessionId,
      canvasData);
  }
}
