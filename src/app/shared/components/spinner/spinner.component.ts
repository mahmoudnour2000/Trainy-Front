import { Component } from '@angular/core';
import { LoaderService } from '../../../core/services/loader.service'; // Ensure correct path
import { CommonModule } from '@angular/common'; // Import CommonModule for async pipe and ngIf

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule], // Import CommonModule
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent {
  get isLoading$() {
    return this.loaderService.isLoading$;  // Access isLoading$ through a getter
  }
  constructor(public loaderService: LoaderService) { }
}
