import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicChatRoutingModule } from './public-chat-routing.module';
import { PublicChatComponent } from './public-chat.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, FormsModule, PublicChatRoutingModule, PublicChatComponent],
  exports: [PublicChatComponent]
})
export class PublicChatModule { }