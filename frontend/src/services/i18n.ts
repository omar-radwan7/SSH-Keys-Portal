/**
 * Internationalization service for SSH Key Portal
 * Supports English and Arabic with RTL layout
 * Implements WCAG 2.1 AA accessibility requirements
 */

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

interface TranslationStrings {
  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  add: string;
  close: string;
  confirm: string;
  yes: string;
  no: string;
  
  // Authentication
  'auth.login': string;
  'auth.logout': string;
  'auth.username': string;
  'auth.password': string;
  'auth.signIn': string;
  'auth.signInAs': string;
  'auth.userLogin': string;
  'auth.adminLogin': string;
  'auth.welcome': string;
  'auth.invalidCredentials': string;
  'auth.accountLocked': string;
  
  // Navigation
  'nav.dashboard': string;
  'nav.admin': string;
  'nav.settings': string;
  'nav.logout': string;
  
  // SSH Keys
  'keys.title': string;
  'keys.import': string;
  'keys.generate': string;
  'keys.generateClient': string;
  'keys.generateServer': string;
  'keys.algorithm': string;
  'keys.bitLength': string;
  'keys.comment': string;
  'keys.fingerprint': string;
  'keys.status': string;
  'keys.expires': string;
  'keys.created': string;
  'keys.actions': string;
  'keys.revoke': string;
  'keys.rotate': string;
  'keys.noKeys': string;
  'keys.importSuccess': string;
  'keys.generateSuccess': string;
  'keys.revokeSuccess': string;
  'keys.rotateSuccess': string;
  'keys.deploymentStatus': string;
  
  // Status indicators
  'status.active': string;
  'status.deprecated': string;
  'status.revoked': string;
  'status.expired': string;
  'status.healthy': string;
  'status.degraded': string;
  'status.syncing': string;
  'status.unknown': string;
  
  // Admin
  'admin.title': string;
  'admin.overview': string;
  'admin.hosts': string;
  'admin.users': string;
  'admin.security': string;
  'admin.policies': string;
  'admin.metrics': string;
  'admin.alerts': string;
  
  // Security
  'security.rateLimitExceeded': string;
  'security.accountLocked': string;
  'security.suspiciousActivity': string;
  'security.alertAcknowledged': string;
  
  // Accessibility
  'a11y.skipToMain': string;
  'a11y.menuToggle': string;
  'a11y.closeModal': string;
  'a11y.loading': string;
  'a11y.error': string;
  'a11y.success': string;
  'a11y.required': string;
}

const translations: Record<Language, TranslationStrings> = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    
    // Authentication
    'auth.login': 'Login',
    'auth.logout': 'Sign Out',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.signIn': 'Sign In',
    'auth.signInAs': 'Sign In as {role}',
    'auth.userLogin': 'User Login',
    'auth.adminLogin': 'Admin Login',
    'auth.welcome': 'Welcome, {name}',
    'auth.invalidCredentials': 'Invalid credentials or account disabled',
    'auth.accountLocked': 'Account temporarily locked. Try again later.',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin',
    'nav.settings': 'Settings',
    'nav.logout': 'Sign Out',
    
    // SSH Keys
    'keys.title': 'My SSH Keys',
    'keys.import': 'Import Key',
    'keys.generate': 'Generate Key',
    'keys.generateClient': 'Generate Key (Client)',
    'keys.generateServer': 'Generate Key (Server)',
    'keys.algorithm': 'Algorithm',
    'keys.bitLength': 'Key Length',
    'keys.comment': 'Comment',
    'keys.fingerprint': 'Fingerprint',
    'keys.status': 'Status',
    'keys.expires': 'Expires',
    'keys.created': 'Created',
    'keys.actions': 'Actions',
    'keys.revoke': 'Revoke',
    'keys.rotate': 'Rotate',
    'keys.noKeys': 'No SSH Keys',
    'keys.importSuccess': 'SSH key imported successfully',
    'keys.generateSuccess': 'SSH key generated successfully',
    'keys.revokeSuccess': 'SSH key revoked successfully',
    'keys.rotateSuccess': 'SSH key rotated successfully',
    'keys.deploymentStatus': 'Deployment Status',
    
    // Status indicators
    'status.active': 'Active',
    'status.deprecated': 'Deprecated',
    'status.revoked': 'Revoked',
    'status.expired': 'Expired',
    'status.healthy': 'Healthy',
    'status.degraded': 'Degraded',
    'status.syncing': 'Syncing',
    'status.unknown': 'Unknown',
    
    // Admin
    'admin.title': 'Admin Portal',
    'admin.overview': 'Overview',
    'admin.hosts': 'Hosts',
    'admin.users': 'Users',
    'admin.security': 'Security',
    'admin.policies': 'Policies',
    'admin.metrics': 'Metrics',
    'admin.alerts': 'Alerts',
    
    // Security
    'security.rateLimitExceeded': 'Rate limit exceeded. Please try again later.',
    'security.accountLocked': 'Account locked due to suspicious activity.',
    'security.suspiciousActivity': 'Suspicious activity detected.',
    'security.alertAcknowledged': 'Security alert acknowledged.',
    
    // Accessibility
    'a11y.skipToMain': 'Skip to main content',
    'a11y.menuToggle': 'Toggle navigation menu',
    'a11y.closeModal': 'Close modal dialog',
    'a11y.loading': 'Content is loading',
    'a11y.error': 'An error has occurred',
    'a11y.success': 'Action completed successfully',
    'a11y.required': 'This field is required',
  },
  
  ar: {
    // Common - Arabic translations
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    close: 'إغلاق',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',
    
    // Authentication
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.username': 'اسم المستخدم',
    'auth.password': 'كلمة المرور',
    'auth.signIn': 'تسجيل الدخول',
    'auth.signInAs': 'تسجيل الدخول كـ {role}',
    'auth.userLogin': 'تسجيل دخول المستخدم',
    'auth.adminLogin': 'تسجيل دخول المدير',
    'auth.welcome': 'مرحباً، {name}',
    'auth.invalidCredentials': 'بيانات اعتماد غير صحيحة أو حساب معطل',
    'auth.accountLocked': 'الحساب مقفل مؤقتاً. حاول مرة أخرى لاحقاً.',
    
    // Navigation
    'nav.dashboard': 'لوحة القيادة',
    'nav.admin': 'المدير',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    
    // SSH Keys
    'keys.title': 'مفاتيح SSH الخاصة بي',
    'keys.import': 'استيراد مفتاح',
    'keys.generate': 'إنشاء مفتاح',
    'keys.generateClient': 'إنشاء مفتاح (العميل)',
    'keys.generateServer': 'إنشاء مفتاح (الخادم)',
    'keys.algorithm': 'الخوارزمية',
    'keys.bitLength': 'طول المفتاح',
    'keys.comment': 'تعليق',
    'keys.fingerprint': 'البصمة',
    'keys.status': 'الحالة',
    'keys.expires': 'ينتهي',
    'keys.created': 'تم الإنشاء',
    'keys.actions': 'الإجراءات',
    'keys.revoke': 'إلغاء',
    'keys.rotate': 'تدوير',
    'keys.noKeys': 'لا توجد مفاتيح SSH',
    'keys.importSuccess': 'تم استيراد مفتاح SSH بنجاح',
    'keys.generateSuccess': 'تم إنشاء مفتاح SSH بنجاح',
    'keys.revokeSuccess': 'تم إلغاء مفتاح SSH بنجاح',
    'keys.rotateSuccess': 'تم تدوير مفتاح SSH بنجاح',
    'keys.deploymentStatus': 'حالة النشر',
    
    // Status indicators
    'status.active': 'نشط',
    'status.deprecated': 'مهمل',
    'status.revoked': 'ملغي',
    'status.expired': 'منتهي الصلاحية',
    'status.healthy': 'سليم',
    'status.degraded': 'متدهور',
    'status.syncing': 'مزامنة',
    'status.unknown': 'غير معروف',
    
    // Admin
    'admin.title': 'بوابة المدير',
    'admin.overview': 'نظرة عامة',
    'admin.hosts': 'المضيفات',
    'admin.users': 'المستخدمون',
    'admin.security': 'الأمان',
    'admin.policies': 'السياسات',
    'admin.metrics': 'المقاييس',
    'admin.alerts': 'التنبيهات',
    
    // Security
    'security.rateLimitExceeded': 'تم تجاوز حد المعدل. يرجى المحاولة مرة أخرى لاحقاً.',
    'security.accountLocked': 'الحساب مقفل بسبب نشاط مشبوه.',
    'security.suspiciousActivity': 'تم اكتشاف نشاط مشبوه.',
    'security.alertAcknowledged': 'تم الإقرار بالتنبيه الأمني.',
    
    // Accessibility
    'a11y.skipToMain': 'تخطي إلى المحتوى الرئيسي',
    'a11y.menuToggle': 'تبديل قائمة التنقل',
    'a11y.closeModal': 'إغلاق مربع الحوار',
    'a11y.loading': 'المحتوى قيد التحميل',
    'a11y.error': 'حدث خطأ',
    'a11y.success': 'تم الإجراء بنجاح',
    'a11y.required': 'هذا الحقل مطلوب',
  }
};

class I18nService {
  private currentLanguage: Language = 'en';
  private listeners: Array<(language: Language, direction: Direction) => void> = [];

  constructor() {
    // Detect browser language preference
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ar')) {
      this.currentLanguage = 'ar';
    }
    
    // Load saved language preference
    const savedLang = localStorage.getItem('ssh-portal-language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      this.currentLanguage = savedLang;
    }
    
    this.applyLanguageSettings();
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getDirection(): Direction {
    return this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
  }

  setLanguage(language: Language): void {
    if (language !== this.currentLanguage) {
      this.currentLanguage = language;
      localStorage.setItem('ssh-portal-language', language);
      this.applyLanguageSettings();
      this.notifyListeners();
    }
  }

  translate(key: keyof TranslationStrings, params?: Record<string, string>): string {
    let translation = translations[this.currentLanguage][key] || translations.en[key] || key;
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`{${param}}`, 'g'), value);
      });
    }
    
    return translation;
  }

  // Shorthand for translate
  t = this.translate.bind(this);

  addLanguageChangeListener(listener: (language: Language, direction: Direction) => void): void {
    this.listeners.push(listener);
  }

  removeLanguageChangeListener(listener: (language: Language, direction: Direction) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private applyLanguageSettings(): void {
    const direction = this.getDirection();
    
    // Set HTML attributes
    document.documentElement.lang = this.currentLanguage;
    document.documentElement.dir = direction;
    
    // Add/remove RTL class for styling
    if (direction === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
    
    // Set CSS custom properties for RTL support
    document.documentElement.style.setProperty('--text-align-start', direction === 'rtl' ? 'right' : 'left');
    document.documentElement.style.setProperty('--text-align-end', direction === 'rtl' ? 'left' : 'right');
    document.documentElement.style.setProperty('--margin-start', direction === 'rtl' ? 'margin-right' : 'margin-left');
    document.documentElement.style.setProperty('--margin-end', direction === 'rtl' ? 'margin-left' : 'margin-right');
    document.documentElement.style.setProperty('--padding-start', direction === 'rtl' ? 'padding-right' : 'padding-left');
    document.documentElement.style.setProperty('--padding-end', direction === 'rtl' ? 'padding-left' : 'padding-right');
  }

  private notifyListeners(): void {
    const direction = this.getDirection();
    this.listeners.forEach(listener => listener(this.currentLanguage, direction));
  }

  // Utility function for formatting numbers based on locale
  formatNumber(num: number): string {
    return new Intl.NumberFormat(this.currentLanguage === 'ar' ? 'ar-EG' : 'en-US').format(num);
  }

  // Utility function for formatting dates based on locale
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = this.currentLanguage === 'ar' ? 'ar-EG' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(dateObj);
  }

  // Utility function for relative time formatting
  formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    const locale = this.currentLanguage === 'ar' ? 'ar-EG' : 'en-US';
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    }
  }
}

// Export singleton instance
export const i18n = new I18nService();
export default i18n; 