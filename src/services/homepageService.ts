import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export interface HeroSlide {
  id: string;
  image: string;
  mobileImage?: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  secondaryCta?: string;
  secondaryLink?: string;
  order: number;
}

export interface HomeSection {
  id: string;
  type: string;
  enabled: boolean;
  heading?: string;
  subheading?: string;
  bgImage?: string;
  bgColor?: string;
  order: number;
}

export interface HomeBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  cta?: string;
  link: string;
  textColor?: 'light' | 'dark';
  position?: 'left' | 'center' | 'right';
  order: number;
  enabled: boolean;
}

export interface HomepageConfig {
  heroSlides: HeroSlide[];
  sections: HomeSection[];
  banners: HomeBanner[];
  updatedAt?: any;
}

const CONFIG_PATH = 'homepage_config/main';

export const homepageService = {
  async getConfig() {
    try {
      const snapshot = await getDoc(doc(db, 'homepage_config', 'main'));
      if (snapshot.exists()) {
        return snapshot.data() as HomepageConfig;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, CONFIG_PATH);
      return null;
    }
  },

  async updateConfig(config: HomepageConfig) {
    try {
      await setDoc(doc(db, 'homepage_config', 'main'), {
        ...config,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, CONFIG_PATH);
      return false;
    }
  }
};
