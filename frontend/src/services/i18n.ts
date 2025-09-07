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
  'auth.currentPassword': string;
  'auth.newPassword': string;
  'auth.signIn': string;
  'auth.signInAs': string;
  'auth.userLogin': string;
  'auth.adminLogin': string;
  'auth.register': string;
  'auth.changePassword': string;
  'auth.welcome': string;
  'auth.invalidCredentials': string;
  'auth.accountLocked': string;
  
  // Navigation
  'nav.dashboard': string;
  'nav.admin': string;
  'nav.settings': string;
  'nav.account': string;
  'nav.logout': string;
  'nav.language': string;
  
  // App
  'app.title': string;

  // Common UI
  'search': string;
  'actions.edit': string;
  'dashboard.accountSettings': string;
  
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
  'admin.managedHosts': string;
  'admin.activeUsers': string;
  'admin.sshKeys': string;
  'admin.total': string;
  'admin.new': string;
  'admin.inactive': string;
  'admin.addManagedHost': string;
  'admin.hostname': string;
  'admin.ipAddress': string;
  'admin.osFamily': string;
  'admin.addHost': string;
  'admin.applySshKeys': string;
  'admin.applyKeys': string;
  'admin.noManagedHosts': string;
  
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

  // Admin User Management and common form/messages
  'Failed to load users': string;
  'Failed to update username': string;
  'Failed to reset password': string;
  'User updated successfully': string;
  'Failed to update user': string;
  'Failed to create account': string;
  'Failed to create account. Please try again.': string;
  'Cannot modify other admin accounts': string;
  'User role updated to': string;
  'Failed to update user role': string;
  'User status updated to': string;
  'Failed to update user status': string;
  'Failed to delete user': string;
  'User deleted successfully': string;
  'New': string;
  'Active': string;
  'Inactive': string;
  'Today': string;
  '1 day ago': string;
  'days ago': string;
  'Admin': string;
  'User': string;
  'Users': string;
  'Admins': string;
  'Create, search, and manage users and admins': string;
  'Create Account': string;
  'Username': string;
  'Username is required': string;
  'Username must be at least 3 characters': string;
  'Username can only contain letters, numbers, hyphens, and underscores': string;
  'Enter username': string;
  'Username is invalid': string;
  'Display Name': string;
  'Display name is required': string;
  'Full name': string;
  'Email (Optional)': string;
  'Please enter a valid email': string;
  'email@example.com': string;
  'Password is required': string;
  'Password must be at least 8 characters': string;
  'Password must contain uppercase, lowercase, number, and special character': string;
  'Create secure password': string;
  'Password does not meet requirements': string;
  'Confirm Password': string;
  'Please confirm your password': string;
  'Passwords do not match': string;
  'Confirm password': string;
  'Account Type': string;
  'Creating...': string;
  'Search users...': string;
  'All Roles': string;
  'Role': string;
  'Status': string;
  'Created': string;
  'Actions': string;
  'Role changes are disabled': string;
  'No users found': string;
  'Try adjusting your search or filters.': string;
  'Get started by creating a new user account.': string;
  'Edit User': string;
  'Reset Password': string;
  'Leave blank to keep current': string;
  'Save': string;
  'Password': string;
  'Cancel': string;

  // Dashboard
  'dashboard.title': string;
  'dashboard.mySSHKeys': string;
  'dashboard.noSSHKeys': string;
  'dashboard.getStarted': string;
  'dashboard.importKey': string;
  'dashboard.generateKey': string;
  'dashboard.generateClientKey': string;
  'dashboard.generateServerKey': string;
  'dashboard.revokeKey': string;
  'dashboard.confirmRevoke': string;
  'dashboard.keyRevoked': string;
  'dashboard.algorithm': string;
  'dashboard.bitLength': string;
  'dashboard.fingerprint': string;
  'dashboard.created': string;
  'dashboard.expires': string;
  'dashboard.status': string;
  'dashboard.actions': string;
  'dashboard.never': string;
  
  // Modal translations
  'modal.importKey': string;
  'modal.generateKey': string;
  'modal.generateClientKey': string;
  'modal.close': string;
  'modal.clientSideGeneration': string;
  'modal.clientSideGenerationDesc': string;
  'form.publicKey': string;
  'form.comment': string;
  'form.algorithm': string;
  'form.keyLength': string;
  'form.generate': string;
  'form.import': string;
  'form.importing': string;
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
    'auth.currentPassword': 'Current Password',
    'auth.newPassword': 'New Password',
    'auth.signIn': 'Sign In',
    'auth.signInAs': 'Sign In as {role}',
    'auth.userLogin': 'User Login',
    'auth.adminLogin': 'Admin Login',
    'auth.register': 'Register',
    'auth.changePassword': 'Change Password',
    'auth.welcome': 'Welcome, {name}',
    'auth.invalidCredentials': 'Invalid credentials or account disabled',
    'auth.accountLocked': 'Account temporarily locked. Try again later.',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin',
    'nav.settings': 'Settings',
    'nav.account': 'Account',
    'nav.logout': 'Sign Out',
    'nav.language': 'Language',

    'app.title': 'HPC SSH Key Portal',
    'search': 'Search',
    'actions.edit': 'Edit',
    'dashboard.accountSettings': 'Account Settings',
    
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
    'admin.managedHosts': 'Managed Hosts',
    'admin.activeUsers': 'Active Users',
    'admin.sshKeys': 'SSH Keys',
    'admin.total': 'Total',
    'admin.new': 'New',
    'admin.inactive': 'Inactive',
    'admin.addManagedHost': 'Add Managed Host',
    'admin.hostname': 'Hostname',
    'admin.ipAddress': 'IP Address',
    'admin.osFamily': 'OS Family',
    'admin.addHost': 'Add Host',
    'admin.applySshKeys': 'Apply SSH Keys',
    'admin.applyKeys': 'Apply Keys',
    'admin.noManagedHosts': 'No managed hosts configured yet.',
    
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

    // Admin/User Management
    'Failed to load users': 'Failed to load users',
    'Failed to update username': 'Failed to update username',
    'Failed to reset password': 'Failed to reset password',
    'User updated successfully': 'User updated successfully',
    'Failed to update user': 'Failed to update user',
    'Failed to create account': 'Failed to create account',
    'Failed to create account. Please try again.': 'Failed to create account. Please try again.',
    'Cannot modify other admin accounts': 'Cannot modify other admin accounts',
    'User role updated to': 'User role updated to',
    'Failed to update user role': 'Failed to update user role',
    'User status updated to': 'User status updated to',
    'Failed to update user status': 'Failed to update user status',
    'Failed to delete user': 'Failed to delete user',
    'User deleted successfully': 'User deleted successfully',
    'New': 'New',
    'Active': 'Active',
    'Inactive': 'Inactive',
    'Today': 'Today',
    '1 day ago': '1 day ago',
    'days ago': 'days ago',
    'Admin': 'Admin',
    'User': 'User',
    'Users': 'Users',
    'Admins': 'Admins',
    'Create, search, and manage users and admins': 'Create, search, and manage users and admins',
    'Create Account': 'Create Account',
    'Username': 'Username',
    'Username is required': 'Username is required',
    'Username must be at least 3 characters': 'Username must be at least 3 characters',
    'Username can only contain letters, numbers, hyphens, and underscores': 'Username can only contain letters, numbers, hyphens, and underscores',
    'Enter username': 'Enter username',
    'Username is invalid': 'Username is invalid',
    'Display Name': 'Display Name',
    'Display name is required': 'Display name is required',
    'Full name': 'Full name',
    'Email (Optional)': 'Email (Optional)',
    'Please enter a valid email': 'Please enter a valid email',
    'email@example.com': 'email@example.com',
    'Password is required': 'Password is required',
    'Password must be at least 8 characters': 'Password must be at least 8 characters',
    'Password must contain uppercase, lowercase, number, and special character': 'Password must contain uppercase, lowercase, number, and special character',
    'Create secure password': 'Create secure password',
    'Password does not meet requirements': 'Password does not meet requirements',
    'Confirm Password': 'Confirm Password',
    'Please confirm your password': 'Please confirm your password',
    'Passwords do not match': 'Passwords do not match',
    'Confirm password': 'Confirm password',
    'Account Type': 'Account Type',
    'Creating...': 'Creating...',
    'Search users...': 'Search users...',
    'All Roles': 'All Roles',
    'Role': 'Role',
    'Status': 'Status',
    'Created': 'Created',
    'Actions': 'Actions',
    'Role changes are disabled': 'Role changes are disabled',
    'No users found': 'No users found',
    'Try adjusting your search or filters.': 'Try adjusting your search or filters.',
    'Get started by creating a new user account.': 'Get started by creating a new user account.',
    'Edit User': 'Edit User',
    'Reset Password': 'Reset Password',
    'Leave blank to keep current': 'Leave blank to keep current',
    'Save': 'Save',
    'Password': 'Password',
    'Cancel': 'Cancel',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.mySSHKeys': 'My SSH Keys',
    'dashboard.noSSHKeys': 'No SSH Keys',
    'dashboard.getStarted': 'Get started by importing or generating your first SSH key.',
    'dashboard.importKey': 'Import Key',
    'dashboard.generateKey': 'Generate Key',
    'dashboard.generateClientKey': 'Generate Key (Client)',
    'dashboard.generateServerKey': 'Generate Key (Server)',
    'dashboard.revokeKey': 'Revoke Key',
    'dashboard.confirmRevoke': 'Are you sure you want to revoke this key?',
    'dashboard.keyRevoked': 'SSH key revoked successfully.',
    'dashboard.algorithm': 'Algorithm',
    'dashboard.bitLength': 'Key Length',
    'dashboard.fingerprint': 'Fingerprint',
    'dashboard.created': 'Created',
    'dashboard.expires': 'Expires',
    'dashboard.status': 'Status',
    'dashboard.actions': 'Actions',
    'dashboard.never': 'Never',
    
    // Modal translations
    'modal.importKey': 'Import SSH Key',
    'modal.generateKey': 'Generate SSH Key',
    'modal.generateClientKey': 'Generate SSH Key (Client)',
    'modal.close': 'Close',
    'modal.clientSideGeneration': 'Client-Side Generation',
    'modal.clientSideGenerationDesc': 'Keys are generated in your browser using Web Crypto API. The private key never leaves your device and is not sent to the server.',
    'form.publicKey': 'Public Key',
    'form.comment': 'Comment',
    'form.algorithm': 'Algorithm',
    'form.keyLength': 'Key Length',
    'form.generate': 'Generate',
    'form.import': 'Import',
    'form.importing': 'Importing...',
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
    'auth.currentPassword': 'كلمة المرور الحالية',
    'auth.newPassword': 'كلمة مرور جديدة',
    'auth.signIn': 'تسجيل الدخول',
    'auth.signInAs': 'تسجيل الدخول كـ {role}',
    'auth.userLogin': 'تسجيل دخول المستخدم',
    'auth.adminLogin': 'تسجيل دخول المدير',
    'auth.register': 'تسجيل',
    'auth.changePassword': 'تغيير كلمة المرور',
    'auth.welcome': 'مرحباً، {name}',
    'auth.invalidCredentials': 'بيانات اعتماد غير صحيحة أو حساب معطل',
    'auth.accountLocked': 'الحساب مقفل مؤقتاً. حاول مرة أخرى لاحقاً.',
    
    // Navigation
    'nav.dashboard': 'لوحة القيادة',
    'nav.admin': 'المدير',
    'nav.settings': 'الإعدادات',
    'nav.account': 'الحساب',
    'nav.logout': 'تسجيل الخروج',
    'nav.language': 'اللغة',

    'app.title': 'بوابة مفاتيح SSH',
    'search': 'بحث',
    'actions.edit': 'تعديل',
    'dashboard.accountSettings': 'إعدادات الحساب',
    
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
    'admin.managedHosts': 'الخوادم المُدارة',
    'admin.activeUsers': 'المستخدمون النشطون',
    'admin.sshKeys': 'مفاتيح SSH',
    'admin.total': 'إجمالي',
    'admin.new': 'جديد',
    'admin.inactive': 'غير نشط',
    'admin.addManagedHost': 'إضافة خادم مُدار',
    'admin.hostname': 'اسم المضيف',
    'admin.ipAddress': 'عنوان IP',
    'admin.osFamily': 'عائلة نظام التشغيل',
    'admin.addHost': 'إضافة خادم',
    'admin.applySshKeys': 'تطبيق مفاتيح SSH',
    'admin.applyKeys': 'تطبيق المفاتيح',
    'admin.noManagedHosts': 'لم يتم تكوين أي خوادم مُدارة بعد.',
    
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

    // Admin/User Management
    'Failed to load users': 'فشل تحميل المستخدمين',
    'Failed to update username': 'فشل تحديث اسم المستخدم',
    'Failed to reset password': 'فشل إعادة تعيين كلمة المرور',
    'User updated successfully': 'تم تحديث المستخدم بنجاح',
    'Failed to update user': 'فشل تحديث المستخدم',
    'Failed to create account': 'فشل إنشاء الحساب',
    'Failed to create account. Please try again.': 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.',
    'Cannot modify other admin accounts': 'لا يمكن تعديل حسابات المديرين الآخرين',
    'User role updated to': 'تم تحديث دور المستخدم إلى',
    'Failed to update user role': 'فشل تحديث دور المستخدم',
    'User status updated to': 'تم تحديث حالة المستخدم إلى',
    'Failed to update user status': 'فشل تحديث حالة المستخدم',
    'Failed to delete user': 'فشل حذف المستخدم',
    'User deleted successfully': 'تم حذف المستخدم بنجاح',
    'New': 'جديد',
    'Active': 'نشط',
    'Inactive': 'غير نشط',
    'Today': 'اليوم',
    '1 day ago': 'منذ يوم',
    'days ago': 'منذ أيام',
    'Admin': 'مدير',
    'User': 'مستخدم',
    'Users': 'المستخدمون',
    'Admins': 'المديرون',
    'Create, search, and manage users and admins': 'إنشاء وبحث وإدارة المستخدمين والمديرين',
    'Create Account': 'إنشاء حساب',
    'Username': 'اسم المستخدم',
    'Username is required': 'اسم المستخدم مطلوب',
    'Username must be at least 3 characters': 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل',
    'Username can only contain letters, numbers, hyphens, and underscores': 'يمكن أن يحتوي اسم المستخدم على أحرف وأرقام وشرطات وشرطات سفلية فقط',
    'Enter username': 'أدخل اسم المستخدم',
    'Username is invalid': 'اسم المستخدم غير صالح',
    'Display Name': 'الاسم الظاهر',
    'Display name is required': 'الاسم الظاهر مطلوب',
    'Full name': 'الاسم الكامل',
    'Email (Optional)': 'البريد الإلكتروني (اختياري)',
    'Please enter a valid email': 'يرجى إدخال بريد إلكتروني صالح',
    'email@example.com': 'email@example.com',
    'Password is required': 'كلمة المرور مطلوبة',
    'Password must be at least 8 characters': 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
    'Password must contain uppercase, lowercase, number, and special character': 'يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة ورقم وحرف خاص',
    'Create secure password': 'أنشئ كلمة مرور آمنة',
    'Password does not meet requirements': 'كلمة المرور لا تلبي المتطلبات',
    'Confirm Password': 'تأكيد كلمة المرور',
    'Please confirm your password': 'يرجى تأكيد كلمة المرور',
    'Passwords do not match': 'كلمتا المرور غير متطابقتين',
    'Confirm password': 'تأكيد كلمة المرور',
    'Account Type': 'نوع الحساب',
    'Creating...': 'يتم الإنشاء...',
    'Search users...': 'ابحث عن المستخدمين...',
    'All Roles': 'كل الأدوار',
    'Role': 'الدور',
    'Status': 'الحالة',
    'Created': 'تاريخ الإنشاء',
    'Actions': 'الإجراءات',
    'Role changes are disabled': 'تغييرات الدور معطلة',
    'No users found': 'لم يتم العثور على مستخدمين',
    'Try adjusting your search or filters.': 'حاول تعديل البحث أو المرشحات.',
    'Get started by creating a new user account.': 'ابدأ بإنشاء حساب مستخدم جديد.',
    'Edit User': 'تعديل المستخدم',
    'Reset Password': 'إعادة تعيين كلمة المرور',
    'Leave blank to keep current': 'اتركه فارغاً للاحتفاظ بالحالي',
    'Save': 'حفظ',
    'Password': 'كلمة المرور',
    'Cancel': 'إلغاء',

    // Dashboard
    'dashboard.title': 'لوحة القيادة',
    'dashboard.mySSHKeys': 'مفاتيح SSH الخاصة بي',
    'dashboard.noSSHKeys': 'لا توجد مفاتيح SSH',
    'dashboard.getStarted': 'ابدأ بإستيراد أو إنشاء أول مفتاح SSH خاص بك.',
    'dashboard.importKey': 'استيراد مفتاح',
    'dashboard.generateKey': 'إنشاء مفتاح',
    'dashboard.generateClientKey': 'إنشاء مفتاح (العميل)',
    'dashboard.generateServerKey': 'إنشاء مفتاح (الخادم)',
    'dashboard.revokeKey': 'إلغاء مفتاح',
    'dashboard.confirmRevoke': 'هل أنت متأكد من إلغاء هذا المفتاح؟',
    'dashboard.keyRevoked': 'تم إلغاء مفتاح SSH بنجاح.',
    'dashboard.algorithm': 'الخوارزمية',
    'dashboard.bitLength': 'طول المفتاح',
    'dashboard.fingerprint': 'البصمة',
    'dashboard.created': 'تم الإنشاء',
    'dashboard.expires': 'ينتهي',
    'dashboard.status': 'الحالة',
    'dashboard.actions': 'الإجراءات',
    'dashboard.never': 'أبداً',
    
    // Modal translations
    'modal.importKey': 'استيراد مفتاح SSH',
    'modal.generateKey': 'إنشاء مفتاح SSH',
    'modal.generateClientKey': 'إنشاء مفتاح SSH (العميل)',
    'modal.close': 'إغلاق',
    'modal.clientSideGeneration': 'توليد على المتصفح',
    'modal.clientSideGenerationDesc': 'يتم إنشاء المفاتيح في متصفحك باستخدام Web Crypto API. المفتاح الخاص لا يغادر جهازك ولا يتم إرساله للخادم.',
    'form.publicKey': 'المفتاح العام',
    'form.comment': 'تعليق',
    'form.algorithm': 'الخوارزمية',
    'form.keyLength': 'طول المفتاح',
    'form.generate': 'إنشاء',
    'form.import': 'استيراد',
    'form.importing': 'جاري الاستيراد...',
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