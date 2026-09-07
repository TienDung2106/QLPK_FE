export interface NavItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface TestimonialItem {
  id: string;
  avatar: string;
  quote: string;
  author: string;
  role?: string;
  rating?: number;
}

export interface ServiceItem {
  id: string;
  iconType: 'basic' | 'deep' | 'acne' | 'laser' | 'rejuvenation' | 'whitening';
  title: string;
  description: string;
}

export interface DoctorItem {
  id: string;
  name: string;
  specialty: string;
  image: string;
  experience?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  image: string;
  date?: string;
  category?: string;
}
