import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appTopToggleSidebar]'
})
export class TopToggleSidebarDirective {

  constructor(private el: ElementRef) {}

  @HostListener('click')
  topToggleSidebar() {
    const sidebar = document.querySelector('#accordionSidebar');
    sidebar?.classList.toggle('toggled');
  }
}
