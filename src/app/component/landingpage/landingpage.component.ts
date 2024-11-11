import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";
import {MatButton} from "@angular/material/button";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [
    RouterLink,
    MatButton,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './landingpage.component.html',
  styleUrl: './landingpage.component.scss'
})
export class LandingpageComponent {

  loggedIn() {
    if(sessionStorage.getItem('userName')) {
      return true;
    }
  }

  protected readonly sessionStorage = sessionStorage;

  getUserName() {
    return sessionStorage.getItem('userName');
  }
}
