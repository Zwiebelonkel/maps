import { Injectable } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';

interface BannerAdOptions {
  adId: string;
  adSize: 'ADAPTIVE_BANNER';
  position: 'BOTTOM_CENTER';
}

interface RewardAdOptions {
  adId: string;
}

interface AdMobPlugin {
  initialize(options: { requestTrackingAuthorization: boolean }): Promise<void>;
  showBanner(options: BannerAdOptions): Promise<void>;
  hideBanner(): Promise<void>;
  prepareRewardVideoAd(options: RewardAdOptions): Promise<void>;
  showRewardVideoAd(): Promise<void>;
}

const AdMob = registerPlugin<AdMobPlugin>('AdMob');

@Injectable({ providedIn: 'root' })
export class AdmobService {
  private bannerVisible = false;
  private initialized = false;
  private viewReady = false;
  private pendingShow = false;

  async init() {
    if (this.initialized) return;

    try {
      await AdMob.initialize({
        requestTrackingAuthorization: false,
      });
      this.initialized = true;

      App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        if (isActive && !this.viewReady) {
          this.viewReady = true;
          if (this.pendingShow) {
            this.pendingShow = false;
            void this.showBanner();
          }
        }
      });

      setTimeout(() => {
        if (!this.viewReady) {
          this.viewReady = true;
          if (this.pendingShow) {
            this.pendingShow = false;
            void this.showBanner();
          }
        }
      }, 3000);
    } catch (error) {
      console.warn('AdMob init fehlgeschlagen:', error);
    }
  }

  async showBanner() {
    if (this.bannerVisible) return;
    if (!this.viewReady) {
      this.pendingShow = true;
      return;
    }

    const options: BannerAdOptions = {
      adId: 'ca-app-pub-6598292330712260/9917079191',
      adSize: 'ADAPTIVE_BANNER',
      position: 'BOTTOM_CENTER',
    };

    try {
      await AdMob.showBanner(options);
      this.bannerVisible = true;
    } catch (error) {
      console.warn('Banner konnte nicht angezeigt werden:', error);
    }
  }

  async hideBanner() {
    this.pendingShow = false;
    if (!this.bannerVisible) return;

    try {
      await AdMob.hideBanner();
      this.bannerVisible = false;
    } catch (error) {
      console.warn('Banner konnte nicht ausgeblendet werden:', error);
    }
  }

  async showRewardAd(): Promise<boolean> {
    try {
      const options: RewardAdOptions = {
        adId: 'ca-app-pub-6598292330712260/6878289211',
      };

      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();
      return true;
    } catch (error) {
      console.warn('Reward Ad Fehler:', error);
      return false;
    }
  }
}
