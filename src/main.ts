import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
}).catch((err: unknown) => console.error(err));
