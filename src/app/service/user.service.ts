import { HttpClient, HttpParams } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import {User} from '../dto/user';
import * as CryptoJS from 'crypto-js';

const baseUri = environment.backendUrl + '/users';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private http: HttpClient,
  ) {
  }

  register(user: User): Observable<User> {
    user.passwordHash = CryptoJS.SHA256(user.passwordHash.toString()).toString(CryptoJS.enc.Hex);
    return this.http.post<User>(baseUri,
      user);
  }

  login(user: User): Observable<User> {
    user.passwordHash = CryptoJS.SHA256(user.passwordHash.toString()).toString(CryptoJS.enc.Hex);
    return this.http.post<User>(baseUri + '/login',
      user)
  }

}
