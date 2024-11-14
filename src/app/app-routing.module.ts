import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NodeComponent} from "./component/node/node.component";
import {CanvasComponent} from "./component/canvas/canvas.component";
import {UserComponent} from "./component/user/user.component";
import {RegisterComponent} from "./component/register/register.component";
import {LoginComponent} from "./component/login/login.component";
import {LandingpageComponent} from "./component/landingpage/landingpage.component";
import {CanvasCreateComponent} from "./component/canvas/canvas-create/canvas-create.component";


const routes: Routes = [
  {path: '', component: LandingpageComponent},
  {path: 'nodes', children: [
      {path: '', component: NodeComponent},
      //{path: 'create', component: HorseCreateEditComponent, data: {mode: HorseCreateEditMode.create}},
    ]},
  {path: 'canvas', children: [
      {path: 'create', component: CanvasCreateComponent},
      {path: ':id', component: CanvasComponent},


      //{path: 'create', component: HorseCreateEditComponent, data: {mode: HorseCreateEditMode.create}},
    ]},
  {path: 'user', children: [
      {path: '', component: UserComponent},

    ]},
  {path: 'register', component: RegisterComponent},
  {path: 'login', component: LoginComponent},
  {path: '**', redirectTo: 'users'},


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
