import { Injectable } from '@angular/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  RewardAdOptions,
} from '@capacitor-community/admob';

@Injectable({ providedIn: 'root' })
export class AdmobService {
  private bannerVisible = false;
  private initialized = false;

  async init() {
    if (this.initialized) return;

    await AdMob.initialize({
      requestTrackingAuthorization: false,
    });

    this.initialized = true;
  }

  // ───────────── Banner ─────────────

  async showBanner() {
    if (this.bannerVisible) return;

    const options: BannerAdOptions = {
      adId: 'ca-app-pub-6598292330712260/9917079191', // DEINE ID
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
    };

    await AdMob.showBanner(options);
    this.bannerVisible = true;
  }

  async hideBanner() {
    if (!this.bannerVisible) return;

    await AdMob.hideBanner();
    this.bannerVisible = false;
  }

  // ───────────── Reward Ad ─────────────

  async showRewardAd(): Promise<boolean> {
    try {
      const options: RewardAdOptions = {
        adId: 'ca-app-pub-3940256099942544/5224354917', // TEST Reward!
      };

      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();

      return true;
    } catch (e) {
      console.log('Reward Ad Fehler:', e);
      return false;
    }
  }
}
