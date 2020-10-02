import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => {
    const errorMsgElement = document.querySelector('#errorMsgElement');
    let message = 'Application initialization failed';
    if (err) {
      if (err.message) {
        message = message + ': ' + err.message;
      } else {
        message = message + ': ' + err;
      }
    }
    errorMsgElement.textContent = message;
  });
