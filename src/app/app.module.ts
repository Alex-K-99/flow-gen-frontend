import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastrModule} from 'ngx-toastr';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AutocompleteComponent} from './component/autocomplete/autocomplete.component';
import {HeaderComponent} from './component/header/header.component';
import {PortalModule} from '@angular/cdk/portal';
import {MatDialogModule} from "@angular/material/dialog";
import {MatListModule} from "@angular/material/list";
import {CookieService} from "ngx-cookie-service";
import {MatInputModule} from "@angular/material/input";

// app.module.ts

// Angular Material modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    AutocompleteComponent,
  ],
  bootstrap: [AppComponent],
  imports: [BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgbModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    ToastrModule.forRoot(),
    // Needed for Toastr
    BrowserAnimationsModule,
    PortalModule, MatListModule], providers: [
    provideHttpClient(withInterceptorsFromDi()),
    [CookieService]
  ]
})
export class AppModule {
}
