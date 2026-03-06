import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="about-container py-5 animate-in position-relative">
      <a routerLink="/" class="btn btn-sm btn-outline-secondary position-absolute top-0 start-0 z-3 rounded-pill px-3 shadow-sm bg-white mt-n2 ms-n2">
        <i class="bi bi-arrow-left me-2"></i>Volver a MotorX
      </a>
      <div class="row justify-content-center mb-5 mt-4">
        <div class="col-lg-8 text-center">
          <h1 class="display-3 fw-bold mb-4 tracking-tight">{{ 'aboutUs.title' | translate }} <span class="text-motorx-primary">{{ 'aboutUs.titleHighlight' | translate }}</span></h1>
          <p class="lead text-muted fs-4 landing-text">
            {{ 'aboutUs.intro' | translate }}
          </p>
        </div>
      </div>

      <div class="row g-4 mb-5">
        <div class="col-md-6 h-100">
          <div class="card about-card p-4 p-md-5 h-100 glass-effect shadow-hover">
            <div class="icon-circle mb-4 bg-primary-light">
              <i class="bi bi-rocket-takeoff-fill fs-2 text-motorx-primary"></i>
            </div>
            <h2 class="fw-bold mb-3">{{ 'aboutUs.missionTitle' | translate }}</h2>
            <p class="text-muted fs-5">
              {{ 'aboutUs.missionText' | translate }}
            </p>
          </div>
        </div>
        <div class="col-md-6 h-100">
          <div class="card about-card p-4 p-md-5 h-100 glass-effect shadow-hover">
            <div class="icon-circle mb-4 bg-primary-light">
              <i class="bi bi-eye-fill fs-2 text-motorx-primary"></i>
            </div>
            <h2 class="fw-bold mb-3">{{ 'aboutUs.visionTitle' | translate }}</h2>
            <p class="text-muted fs-5">
              {{ 'aboutUs.visionText' | translate }}
            </p>
          </div>
        </div>
      </div>

      <div class="card p-4 p-md-5 glass-effect text-center mb-5 border-0">
        <h2 class="fw-bold mb-5">{{ 'aboutUs.valuesTitle' | translate }}</h2>
        <div class="row g-4 justify-content-center">
          <div class="col-6 col-md-3">
            <div class="value-item">
              <i class="bi bi-heart-fill fs-1 text-danger mb-2 d-block"></i>
              <h5 class="fw-bold">{{ 'aboutUs.passion' | translate }}</h5>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="value-item">
              <i class="bi bi-shield-check fs-1 text-success mb-2 d-block"></i>
              <h5 class="fw-bold">{{ 'aboutUs.transparency' | translate }}</h5>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="value-item">
              <i class="bi bi-cpu-fill fs-1 text-motorx-primary mb-2 d-block"></i>
              <h5 class="fw-bold">{{ 'aboutUs.innovation' | translate }}</h5>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="value-item">
              <i class="bi bi-award-fill fs-1 text-warning mb-2 d-block"></i>
              <h5 class="fw-bold">{{ 'aboutUs.quality' | translate }}</h5>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center">
        <a routerLink="/register" class="btn btn-primary btn-lg px-5 py-3 shadow-lg">
          {{ 'aboutUs.ctaButton' | translate }} <i class="bi bi-arrow-right ms-2"></i>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .about-container { max-width: 1200px; margin: 0 auto; }
    .about-card { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); border-radius: 2rem; }
    .about-card:hover { transform: translateY(-10px); }
    .icon-circle { width: 64px; height: 64px; border-radius: 1.25rem; display: flex; align-items: center; justify-content: center; }
    .bg-primary-light { background-color: var(--mx-primary-light); }
    .glass-effect { background: var(--mx-bg-card); backdrop-filter: blur(10px); border: 1px solid var(--mx-border-light); }
    .value-item i { transition: transform 0.3s ease; }
    .value-item:hover i { transform: scale(1.2) rotate(5deg); }
    .animate-in { animation: slideUp 0.6s ease-out forwards; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .landing-text { line-height: 1.6; opacity: 0.9; }
  `]
})
export class AboutUs { }
