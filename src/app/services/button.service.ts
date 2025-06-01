import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ButtonService {

  constructor() { }
  actionButton(
    iconClass: string,
    title: string,
    id: number,
    btnClass: string,
    hasPermission: boolean,
    extraDisabled: boolean = false
  ): string {
    const isDisabled = !hasPermission || extraDisabled;
    const tooltip = hasPermission ? title : 'No permission';
    return `
      <button class="btn ${btnClass} btn-sm btn-icon" data-id="${id}" title="${tooltip}" ${isDisabled ? 'disabled' : ''}>
        <i class="${iconClass}"></i>
      </button>`;
  }
}
