import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../../services/permission.service';

@Directive({
  selector: '[appHasPermission]'
})
export class HasPermissionDirective {
  private permission: string | null = null;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  @Input()
  set appHasPermission(permission: string) {
    this.permission = permission;
    this.updateView();
  }

  private updateView(): void {
    this.permissionService.hasPermission(this.permission!).subscribe(has => {
      this.viewContainer.clear();
      if (has) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}