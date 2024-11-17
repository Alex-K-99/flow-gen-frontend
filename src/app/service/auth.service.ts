import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {map, Observable, tap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {User} from '../dto/user';
import * as CryptoJS from 'crypto-js';
import {AuthToken} from "../dto/authToken";

const baseUri = environment.backendUrl + '/auth';
const usersBaseUri = environment.backendUrl + '/users'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
  ) {
  }

  register(user: User): void {
    user.password = CryptoJS.SHA256(user.password.toString()).toString(CryptoJS.enc.Hex);
    this.http.post<AuthToken>(baseUri + '/register',
      user)
      .pipe(
        tap(response => {
          // Extract and store the token from the response body
          const token = response.token;
          if (token) {
            this.setAuthToken(token);
          } else {
            console.error('Token missing in response');
          }
        })
      )
      .subscribe();
      ;
  }

  login(user: User): void {
    user.password = CryptoJS.SHA256(user.password.toString()).toString(CryptoJS.enc.Hex);
    this.http.post<AuthToken>(baseUri + '/authenticate',
      user, {observe: 'response'})
      .pipe(
        tap(response => {
          // Extract and store the token from the response body
          const token = response.body?.token;
          if (token) {
            this.setAuthToken(token);
          } else {
            console.error('Token missing in response');
          }
        })
      )
      .subscribe();
  }


  getAuthToken(): string | null {
    return window.localStorage.getItem("auth_token");
  }
  setAuthToken(token: string | null) {
    if(token !== null) {
      window.localStorage.setItem("auth_token", 'Bearer ' + token);
    } else {
      window.localStorage.removeItem("auth_token");
    }
  }

  reload(sessionId :string): Observable<User> {

    return this.http.post<User>(usersBaseUri + '/reload', {});
  }
}
