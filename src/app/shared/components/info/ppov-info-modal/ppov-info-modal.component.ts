import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalComponent } from '../../ui/modal/modal.component';

@Component({
  selector: 'app-ppov-info-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './ppov-info-modal.component.html',
  styles: ``
})
export class PpoVInfoModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}

