import { Component } from '@angular/core';
import { NavbarMenuOptionsComponent } from "./navbar-menu-options/navbar-menu-options.component";
import { NavbarMenuProfileComponent } from "./navbar-menu-profile/navbar-menu-profile.component";

@Component({
  selector: 'navbar-menu-admin',
  imports: [NavbarMenuOptionsComponent, NavbarMenuProfileComponent],
  templateUrl: './navbar-menu.component.html',
  styles: ``
})
export class NavbarMenuComponent {

}
