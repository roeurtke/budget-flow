import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appToggleSidebar]'
})
export class ToggleSidebarDirective {
  @HostListener('click')
  toggleSidebar() {
    const sidebar = document.querySelector('#accordionSidebar');
    const body = document.body;
    const collapseElements = document.querySelectorAll('.bg-white.py-2.collapse-inner.rounded');

    // Toggle sidebar
    if (sidebar) {
      sidebar.classList.toggle('toggled');
      body.classList.toggle('sidebar-toggled');
      // console.log('Sidebar toggled');
    } else {
      console.warn('Sidebar element not found');
    }

    // Collapse all submenus
    collapseElements.forEach(el => {
      el.parentElement?.classList.add('collapse');
      el.parentElement?.classList.remove('show');
      // console.log('Collapse element toggled');
    });
  }
}
