import { Component, OnInit } from '@angular/core';
import {RouterLink} from "@angular/router";
import {MatButton} from "@angular/material/button";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {Canvas} from "../../dto/canvas";
import {CanvasService} from "../../service/canvas.service";
import {User} from "../../dto/user";
import {UserService} from "../../service/user.service";

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [
    RouterLink,
    MatButton,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgForOf
  ],
  templateUrl: './landingpage.component.html',
  styleUrl: './landingpage.component.scss'
})
export class LandingpageComponent {
  canvases: Canvas[] = [];
  sessionId = sessionStorage.getItem('sessionId');
  private user = <User>{};

  constructor(private canvasService :CanvasService,
              private userService: UserService) {
  }

  ngOnInit(): void {
    this.user = {
      id: Number(sessionStorage.getItem('userId')!),
      sessionId: sessionStorage.getItem('sessionId')!,
      username: sessionStorage.getItem('userName')!,
      passwordHash: ''
    };
    this.reloadUser();
    this.reloadCanvases();
  }

  loggedIn() {
    const username = sessionStorage.getItem('userName');
    console.log(username);
    if(username != null) {
      return true;
    }
    return false;
  }

  protected readonly sessionStorage = sessionStorage;

  getUserName() {
    return sessionStorage.getItem('userName');
  }

  private reloadCanvases() {
    this.canvasService.getCanvasesOfUser(this.user.id, this.user.sessionId).subscribe(
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
    const sessionId = sessionStorage.getItem('sessionId');
    const id = sessionStorage.getItem('userId');
    if(sessionId === null || id === null) {
      console.log("Not logged in, thus cant reload!")
      return;
    }
    const user = this.userService.reload(sessionId, Number(id)).subscribe(
      {
        next: data => {
          this.user = data;
          console.log(this.user.id, this.user.username, this.user.sessionId);
        },
        error: err => {
          console.error(err);
          this.sessionStorage.clear();
        }
      }
    )
  }
}
