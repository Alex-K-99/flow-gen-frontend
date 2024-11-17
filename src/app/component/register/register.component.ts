import { Component, OnInit } from '@angular/core';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { first } from 'rxjs/operators';

import { AuthService } from '../../service/auth.service';
import {AlertService} from "../../service/alert.service";
import {NgClass} from "@angular/common";
import {CookieService} from "ngx-cookie-service";

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    RouterLink
  ],
  templateUrl: 'register.component.html'
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: AuthService,
    private alertService: AlertService,
    private cookieService: CookieService,
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email: ['', Validators.required],
      username: ['', Validators.required],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    /*this.userService.register(this.form.value)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.alertService.success('Registration successful', { keepAfterRouteChange: true });
          /*sessionStorage.setItem('sessionId', data.sessionId);
          sessionStorage.setItem('userId', data.id.toString());
          sessionStorage.setItem('userName', data.username.toString());
          this.router.navigate([''], { relativeTo: this.route });
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  */
  }
}
