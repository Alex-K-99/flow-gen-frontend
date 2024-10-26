import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {
  HorseCreateEditComponent,
  HorseCreateEditMode
} from './component/horse/horse-create-edit/horse-create-edit.component';
import {HorseComponent} from './component/horse/horse.component';
import {NodeComponent} from "./component/node/node.component";


const routes: Routes = [
  {path: '', redirectTo: 'recipes', pathMatch: 'full'},
  {path: 'horses', children: [
    {path: '', component: HorseComponent},
    {path: 'create', component: HorseCreateEditComponent, data: {mode: HorseCreateEditMode.create}},
  ]},
  {path: 'nodes', children: [
      {path: '', component: NodeComponent},
      //{path: 'create', component: HorseCreateEditComponent, data: {mode: HorseCreateEditMode.create}},
    ]},
  {path: '**', redirectTo: 'recipes'},


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
