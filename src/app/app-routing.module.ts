import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WebsocketPageComponent} from './page/websocket-page/websocket-page.component';

const routes: Routes = [
  {path: '', redirectTo: 'websocket', pathMatch: 'full'},
  {path: 'websocket/:id', component: WebsocketPageComponent}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true
    })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
