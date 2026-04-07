import { Component } from '@angular/core';
import { SideMenuHeaderComponent } from "./side-menu-header/side-menu-header.component";
import { SideMenuOptionsComponent } from "./side-menu-options/side-menu-options.component";

@Component({
  selector: 'sidebar-menu-admin',
  imports: [SideMenuHeaderComponent, SideMenuOptionsComponent],
  templateUrl: './sidebar-menu.component.html',
  styles: ``
})
export class SidebarMenuComponent {

}
