import { Component, OnInit } from '@angular/core';
import {RouterLink} from "@angular/router";
import {MatButton, MatIconButton} from "@angular/material/button";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {Canvas} from "../../dto/canvas";
import {CanvasService} from "../../service/canvas.service";
import {User} from "../../dto/user";
import {AuthService} from "../../service/auth.service";
import {MatIcon} from "@angular/material/icon";
import {WelcomeComponent} from "../welcome/welcome.component";
import {LoginComponent} from "../login/login.component";

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [
    RouterLink,
    MatButton,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgForOf,
    MatIconButton,
    MatIcon,
    WelcomeComponent,
    LoginComponent
  ],
  templateUrl: './landingpage.component.html',
  styleUrl: './landingpage.component.scss'
})
export class LandingpageComponent {
  canvases: Canvas[] = [];
  sessionId = sessionStorage.getItem('sessionId');
  private user = <User>{};

  constructor(private canvasService :CanvasService,
              private userService: AuthService) {
  }

  ngOnInit(): void {
    this.user = {
      id: Number(sessionStorage.getItem('userId')!),
      sessionId: sessionStorage.getItem('sessionId')!,
      username: sessionStorage.getItem('userName')!,
      password: ''
    };
    this.reloadUser();
    this.reloadCanvases();
  }

  loggedIn() {
    const authToken = localStorage.getItem('auth_token');
    console.log(authToken);
    if(authToken != null) {
      return true;
    }
    return false;
  }

  protected readonly sessionStorage = sessionStorage;

  getUserName() {
    return this.user.username;
  }

  private reloadCanvases() {
    this.canvasService.getCanvasesOfUser().subscribe(
      {
        next: data => {
          this.canvases = data;
        },
        error: err => {
          console.log(err);
        }
      }
    );
    console.log(this.canvases);
  }

  private reloadUser() {
    const authToken = localStorage.getItem('auth_token');
    if(authToken === null) {
      console.log("Not logged in, thus cant reload!")
      return;
    }
    const user = this.userService.reload(authToken).subscribe(
      {
        next: data => {
          this.user = data;
          console.log(this.user.id, this.user.username, this.user.sessionId);
        },
        error: err => {
          console.error(err);
          localStorage.clear();
        }
      }
    )
  }


  onLogin(input: any) {
    console.log('Fired onLogin')
    console.log(input);
    this.userService.login(
      {username: input.username, password: input.password}
    );
  }

  onRegister(input: any) {
    this.userService.register(
      {username: input.username, email: input.email, password: input.password}
    );
  }
}
