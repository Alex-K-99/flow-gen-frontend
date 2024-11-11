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

  getCanvasesOfUser(userId :number) {
    this.httpClient.get(baseUri + '/' + userId)
  }
}
