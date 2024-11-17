import {Component, input} from '@angular/core';
import {LoginComponent} from "../login/login.component";
import {AuthService} from "../../service/auth.service";

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    LoginComponent
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {

  constructor(private userService :AuthService) {
  }
}
