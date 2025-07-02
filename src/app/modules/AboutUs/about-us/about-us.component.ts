import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';

interface Service {
  icon: string;
  title: string;
  description: string;
}

interface Stat {
  number: string;
  label: string;
}

@Component({
  selector: 'app-about-us',
  imports: [CommonModule, NgFor],
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css']
})
export class AboutUsComponent implements OnInit, OnDestroy {
  
  // Slider Images
  sliderImages: string[] = [  
    '/assets/255b5a3c-1998-49a1-b9ee-feea96bae85e.jpeg',
    '/assets/8516df73-9f58-4d53-b4af-d881f6759c8a.jpeg',
    '/assets/0603943f-70e2-4ce7-be26-e5aedecca397.jpeg',
    '/assets/685961a2-760d-40ea-8dc1-6fc514755aad.jpeg',
    '/assets/cbadfdb3-2edc-425d-ba7e-5fc95155ba21.jpeg',
    '/assets/f8a03f7c-3809-44cf-885b-e10aa08760ed.jpeg'
  ];

  // Services Data
  services: Service[] = [
    {
      icon: 'bi bi-train-front fs-1 text-primary',
      title: 'تتبع القطار',
      description: 'اعرف مكان القطار فين قبل ما تخرج من بيتك بخطوة.'
    },
    {
      icon: 'bi bi-chat-dots fs-1 text-primary',
      title: 'شات القطار',
      description: 'اتكلم مع الناس اللي راكبة معاك واعملوا مجتمع على الطريق.'
    },
    {
      icon: 'bi bi-send-check fs-1 text-primary',
      title: 'توصيل الحاجات',
      description: 'عايز تبعت حاجة مع حد موثوق؟ إحنا بنسهّلها.'
    },
    {
      icon: 'bi bi-geo-alt fs-1 text-primary',
      title: 'المعالم القريبة',
      description: 'اعرف إيه حوالين كل محطة ممكن تزوره أو تشتري منه.'
    },
    {
      icon: 'bi bi-search fs-1 text-primary',
      title: 'الحاجات الضايعة',
      description: 'لقيت حاجة؟ ضيّعت حاجة؟ الموقع هيقرب المسافات.'
    },
    {
      icon: 'bi bi-people fs-1 text-primary',
      title: 'شاركنا وساعدنا',
      description: 'ساعدنا نعرف مكان القطار أو طوّر الخدمة بأفكارك.'
    }
  ];

  // Stats Data
  stats: Stat[] = [
    { number: '1000+', label: 'مستخدم نشط' },
    { number: '50+', label: 'رحلة يومياً' },
    { number: '10+', label: 'محطة مغطاة' },
    { number: '24/7', label: 'دعم فني' }
  ];

  // Slider Properties
  currentIndex = 0;
  imageWidth = 370; // Including gap
  interval: any;
  modalActive = false;

  // Getter for current position
  get currentPosition(): number {
    return this.currentIndex * this.imageWidth;
  }

  ngOnInit(): void {
    this.startAutoSlider();
  }

  ngOnDestroy(): void {
    this.stopAutoSlider();
  }

  // Auto Slider Methods
  startAutoSlider(): void {
    this.interval = setInterval(() => {
      this.nextSlide();
    }, 4000); // Change slide every 4 seconds
  }

  stopAutoSlider(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  // Navigation Methods
  nextSlide(): void {
    this.currentIndex++;
    if (this.currentIndex >= this.sliderImages.length) {
      this.currentIndex = 0;
    }
  }

  previousSlide(): void {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.sliderImages.length - 1;
    }
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
    // Restart auto slider when user manually navigates
    this.stopAutoSlider();
    this.startAutoSlider();
  }

  // Modal Methods
  openImageModal(index: number): void {
    this.currentIndex = index;
    this.modalActive = true;
    this.stopAutoSlider(); // Stop auto slider when modal is open
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  }

  closeModal(): void {
    this.modalActive = false;
    this.startAutoSlider(); // Restart auto slider when modal closes
    document.body.style.overflow = 'auto'; // Restore body scroll
  }

  // Mouse Events for Slider
  onMouseEnter(): void {
    this.stopAutoSlider();
  }

  onMouseLeave(): void {
    this.startAutoSlider();
  }

  // Touch Events for Mobile Support
  private touchStartX = 0;
  private touchEndX = 0;

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
    this.stopAutoSlider();
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
    this.startAutoSlider();
  }

  private handleSwipe(): void {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next slide
        this.nextSlide();
      } else {
        // Swipe right - previous slide
        this.previousSlide();
      }
    }
  }

  // Keyboard Navigation
  onKeydown(event: KeyboardEvent): void {
    if (this.modalActive) {
      switch (event.key) {
        case 'ArrowLeft':
          this.previousSlide();
          break;
        case 'ArrowRight':
          this.nextSlide();
          break;
        case 'Escape':
          this.closeModal();
          break;
      }
    }
  }

  // Utility Methods
  trackByIndex(index: number): number {
    return index;
  }

  trackByService(index: number, service: Service): string {
    return service.title;
  }

  trackByStat(index: number, stat: Stat): string {
    return stat.label;
  }
}