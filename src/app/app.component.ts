import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    SpinnerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Trainy App';

  constructor(private http: HttpClient) {} // Inject HttpClient

  // Method to make a test HTTP request
  makeTestRequest(): void {
    console.log('Making test request...');
    // Using a public API that simulates a delay (3 seconds)
    // You can replace this with any API, or an API from your .NET backend
    this.http.get('https://httpstat.us/200?sleep=3000').subscribe({
      next: (response) => {
        console.log('Test request successful:', response);
      },
      error: (error) => {
        console.error('Test request failed:', error);
      },
      complete: () => {
        console.log('Test request completed.');
      }
    });
  }

  // Method to make a faster test HTTP request (for quick spinner flash)
  makeQuickTestRequest(): void {
    console.log('Making quick test request...');
    this.http.get('https://jsonplaceholder.typicode.com/todos/1').subscribe({
      next: (response) => {
        console.log('Quick test request successful:', response);
      },
      error: (error) => {
        console.error('Quick test request failed:', error);
      }
    });
  }
}
