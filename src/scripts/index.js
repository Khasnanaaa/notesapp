import 'regenerator-runtime';
import '../styles/styles.css'; 
import routes from './routes/routes';
import StoryApi from './data/story-api'; 

import {
  isCurrentPushSubscriptionAvailable,
  subscribe,
  unsubscribe,
} from './utils/notification-helper';
import {
  generateSubscribeButtonTemplate,
  generateUnsubscribeButtonTemplate,
} from './views/templates/template-creator';

const app = {
  drawerButton: document.getElementById('drawer-button'),
  navigationDrawer: document.getElementById('navigation-drawer'),
  contentContainer: document.getElementById('content'),
  mainContent: document.getElementById('mainContent'),
  logoutBtn: document.getElementById('logoutBtn'),
  loginLink: document.getElementById('loginLink'),
  registerLink: document.getElementById('registerLink'),
  logoutLink: document.getElementById('logoutLink'),
  
  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      // Menggunakan sw.bundle.js yang dihasilkan Workbox (InjectManifest)
      navigator.serviceWorker.register('./sw.bundle.js')
        .then((registration) => {
          console.log('SW: Terdaftar (Workbox)!', registration);
          this._setupPushNotification(); 
        })
        .catch((error) => {
          console.error('SW: Gagal daftar!', error);
        });
    }
  },
  
  async _setupPushNotification() {
    const pushNotificationTools = document.getElementById('push-notification-tools');
    if (!pushNotificationTools || !('PushManager' in window)) return;
    
    const isSubscribed = await isCurrentPushSubscriptionAvailable();

    if (isSubscribed) {
      pushNotificationTools.innerHTML = generateUnsubscribeButtonTemplate();
      const unsubscribeButton = document.getElementById('unsubscribe-button');
      if(unsubscribeButton) {
        unsubscribeButton.addEventListener('click', async () => {
            await unsubscribe();
            this._setupPushNotification();
        });
      }
      return;
    }

    pushNotificationTools.innerHTML = generateSubscribeButtonTemplate();
    const subscribeButton = document.getElementById('subscribe-button');
    if(subscribeButton) {
        subscribeButton.addEventListener('click', async () => {
            await subscribe();
            this._setupPushNotification();
        });
    }
  },

  updateNavVisibility() {
    if (!this.loginLink || !this.registerLink || !this.logoutLink) return;
    const isLoggedIn = localStorage.getItem('userToken');
    if (isLoggedIn) {
      this.loginLink.style.display = 'none';
      this.registerLink.style.display = 'none';
      this.logoutLink.style.display = 'list-item'; 
    } else {
      this.loginLink.style.display = 'list-item';
      this.registerLink.style.display = 'list-item';
      this.logoutLink.style.display = 'none';
    }
  },
  
  async renderPage() {
    this.updateNavVisibility(); 
    const url = window.location.hash.slice(1).toLowerCase();
    const path = url || '/'; 
    const page = routes[path];

    if (page) {
      const renderContent = async () => {
        this.contentContainer.innerHTML = await page.render(); 
        if (page.afterRender) page.afterRender();
        const registration = await navigator.serviceWorker.ready;
        this._setupPushNotification();
      };
      
      if (document.startViewTransition) {
        document.startViewTransition(renderContent);
      } else {
        await renderContent();
      }
    }
    this.navigationDrawer.classList.remove('open');
  },

  _initInstallPrompt() {
    const installBtn = document.getElementById('installAppBtn');
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
      }
    });

    window.addEventListener('appinstalled', () => {
      installBtn.style.display = 'none';
      console.log('PWA was installed');
    });
  },

  init() {
    this._registerServiceWorker(); 
    this._initInstallPrompt();
    window.addEventListener('hashchange', () => this.renderPage()); 
    window.addEventListener('load', () => this.renderPage()); 
    if (this.drawerButton) {
        this.drawerButton.addEventListener('click', () => {
            this.navigationDrawer.classList.toggle('open');
        });
    }
    if (this.logoutBtn) {
        this.logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('userToken');
          window.location.hash = '#/login'; 
        });
    }
  },
};

app.init();
export default app;