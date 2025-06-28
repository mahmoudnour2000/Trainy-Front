import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Performs a GET request to the API
   * @param endpoint The API endpoint to call
   * @param params Optional HTTP parameters
   * @param headers Optional HTTP headers
   * @returns Observable of the API response
   */
  get<T>(endpoint: string, params?: HttpParams | Record<string, string>, headers?: HttpHeaders): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params, headers });
  }

  /**
   * Performs a POST request to the API
   * @param endpoint The API endpoint to call
   * @param body The request body
   * @param headers Optional HTTP headers
   * @returns Observable of the API response
   */
  post<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { headers });
  }

  /**
   * Performs a PUT request to the API
   * @param endpoint The API endpoint to call
   * @param body The request body
   * @param headers Optional HTTP headers
   * @returns Observable of the API response
   */
  put<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, { headers });
  }

  /**
   * Performs a DELETE request to the API
   * @param endpoint The API endpoint to call
   * @param headers Optional HTTP headers
   * @returns Observable of the API response
   */
  delete<T>(endpoint: string, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers });
  }
}
