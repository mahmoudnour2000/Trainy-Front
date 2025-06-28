import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LostAndFound, LostAndFoundSearchRequest, PaginatedResponse } from '../models/lost-and-found';

@Injectable({
  providedIn: 'root'
})
export class LostAndFoundService {
  private apiUrl = `${environment.apiUrl}LostAndFound`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }


 getVerifiedPosts(trainId?: number, pageNumber: number = 1, pageSize: number = 9): Observable<PaginatedResponse<LostAndFound>> {
  let url = `${this.apiUrl}/GetVerifiedPosts?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  if (trainId) {
    url += `&trainId=${trainId}`;
  }
  return this.http.get<PaginatedResponse<LostAndFound>>(url, { headers: this.getAuthHeaders() });
}


  addPost(post: FormData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/AddPost`, post, { headers: this.getAuthHeaders() });
  }

  updatePost(id: number, post: FormData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/UpdatePost/${id}`, post, { headers: this.getAuthHeaders() });
  }

  deletePost(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/deletePost/${id}`, { headers: this.getAuthHeaders() });
  }

searchByDate(date?: string, trainId?: number, pageNumber: number = 1, pageSize: number = 9): Observable<PaginatedResponse<LostAndFound>> {
  let url = `${this.apiUrl}/SearchByDate?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  if (date) {
    url += `&date=${date}`;
  }
  if (trainId) {
    url += `&trainId=${trainId}`;
  }
  return this.http.get<PaginatedResponse<LostAndFound>>(url, { headers: this.getAuthHeaders() });
}
}
