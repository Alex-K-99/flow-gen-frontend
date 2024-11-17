import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {AuthService} from "../../service/auth.service";
import {AlertService} from "../../service/alert.service";
import {CookieService} from "ngx-cookie-service";
import {first} from "rxjs/operators";
import {NgClass} from "@angular/common";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    RouterLink,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  @Output() onSubmitLoginEvent = new EventEmitter();
  @Output() onSubmitRegisterEvent = new EventEmitter();

  username: string = "";
  password: string = "";
  active: string = "login";
  email: string = "";

  onSubmitLogin(): void {
    this.onSubmitLoginEvent.emit({"username" : this.username, "password" : this.password})
  }

  onLoginTab(): void {
    this.active = "login"
  }
  onRegisterTab(): void {
    this.active = "register"
  }

  onSubmitRegister() {
    this.onSubmitRegisterEvent.emit({"username":this.username, "email":this.email, "password":this.password})
  }
}
