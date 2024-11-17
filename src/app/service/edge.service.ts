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
}
