import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'egyptTime',
  standalone: true
})
export class EgyptTimePipe implements PipeTransform {

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '--:--';
    }
    
    try {
      // Convert to Date object
      let date: Date;
      
      if (typeof value === 'string') {
        date = new Date(value);
        
        // If first attempt failed, try with 'T' separator
        if (isNaN(date.getTime()) && value.includes(' ')) {
          date = new Date(value.replace(' ', 'T'));
        }
      } else {
        date = new Date(value);
      }
      
      // Final check if date is valid
      if (isNaN(date.getTime())) {
        return '--:--';
      }
      
      // Add 3 hours for Egypt timezone (UTC+3)
      const egyptTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
      
      // Manual formatting for reliability
      const hours = egyptTime.getHours();
      const minutes = egyptTime.getMinutes();
      
      // Format in 12-hour format with Arabic AM/PM
      let displayHours = hours;
      let period = 'ص'; // صباحاً
      
      if (hours === 0) {
        displayHours = 12;
        period = 'ص';
      } else if (hours === 12) {
        displayHours = 12;
        period = 'م'; // مساءً
      } else if (hours > 12) {
        displayHours = hours - 12;
        period = 'م';
      }
      
      const formattedHours = displayHours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      
      return `${formattedHours}:${formattedMinutes} ${period}`;
      
    } catch (error) {
      return '--:--';
    }
  }
}
