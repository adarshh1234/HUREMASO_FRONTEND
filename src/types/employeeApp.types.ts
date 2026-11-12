export type AppUserStatus = 'Active' | 'Inactive' | 'Suspended' | 'Pending_Activation';
export type AppUserRole = 'Standard' | 'Manager' | 'Field_Staff' | 'Executive' | 'Admin';
export type DeviceType = 'iOS' | 'Android' | 'Web' | 'Tablet';

export interface IEmployeeAppPermissions {
  canViewPayslip: boolean;
  canApplyLeave: boolean;
  canSubmitClaims: boolean;
  canPunchAttendance: boolean;
  canViewDirectory: boolean;
  canSubmitRequests: boolean;
  canViewAnnouncements: boolean;
  canChatSupport: boolean;
  canDownloadDocuments: boolean;
  canUpdateProfilePhoto: boolean;
}

export interface EmployeeAppUser {
  id: string;
  _id?: string;
  employeeId: string;
  appUserId: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  avatarUrl?: string;
  status: AppUserStatus;
  role: AppUserRole;
  deviceId?: string;
  deviceName?: string;
  deviceType: DeviceType;
  osVersion?: string;
  appVersion?: string;
  pushToken?: string;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  lastActiveAt?: string;
  registeredAt: string;
  permissions: IEmployeeAppPermissions;
  sessionTimeoutMinutes: number;
  isOnline?: boolean;
  notes?: string;
}

export type AnnouncementType = 'Announcement' | 'Alert' | 'Update' | 'Maintenance' | 'Policy';
export type AnnouncementAudience = 'All' | 'Department' | 'Role' | 'Specific_Employees';
export type AnnouncementPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type AnnouncementStatus = 'Draft' | 'Scheduled' | 'Sent' | 'Archived';

export interface AppAnnouncement {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: AnnouncementType;
  targetAudience: AnnouncementAudience;
  targetDepartments?: string[];
  targetRoles?: string[];
  targetEmployeeIds?: string[];
  priority: AnnouncementPriority;
  scheduledFor?: string;
  sentAt?: string;
  expiresAt?: string;
  status: AnnouncementStatus;
  readCount: number;
  totalRecipients: number;
  clickActionUrl?: string;
  sendPushNotification: boolean;
  sendInApp: boolean;
  createdBy: string;
  createdAt?: string;
}

export type RequestType = 
  | 'Device_Change' 
  | 'Access_Unlock' 
  | 'Feature_Permission' 
  | 'Profile_Update' 
  | 'Data_Sync_Issue' 
  | 'Offboard_Wipe';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'In_Review';
export type RequestPriority = 'Low' | 'Medium' | 'High';

export interface AppEmployeeRequest {
  id: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  requestType: RequestType;
  title: string;
  details: string;
  status: RequestStatus;
  priority: RequestPriority;
  submittedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  deviceInfo?: string;
}

export type ActivityCategory = 
  | 'Auth' 
  | 'Access_Change' 
  | 'Permission_Update' 
  | 'Broadcast' 
  | 'Request_Action' 
  | 'Config_Change' 
  | 'Security_Event';

export type ActivityStatus = 'Success' | 'Failure' | 'Warning';

export interface AppActivityLog {
  id: string;
  _id?: string;
  employeeId?: string;
  employeeName?: string;
  action: string;
  category: ActivityCategory;
  ipAddress?: string;
  deviceType?: string;
  status: ActivityStatus;
  details?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AppSettingsConfig {
  appName: string;
  currentVersion: string;
  minimumSupportedVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  forceUpdate: boolean;
  allowBiometricLogin: boolean;
  sessionTimeoutMinutes: number;
  allowOfflineMode: boolean;
  maxDevicesPerUser: number;
  allowedFeatures: {
    attendanceGeofence: boolean;
    pushNotifications: boolean;
    offlineSync: boolean;
    documentDownload: boolean;
    darkTheme: boolean;
    profilePhotoUpload: boolean;
  };
  securityPolicy: {
    passcodeExpiryDays: number;
    blockRootedDevices: boolean;
    screenshotBlocked: boolean;
    enforceStrongPassword: boolean;
  };
  supportContactEmail: string;
  supportContactPhone: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface EmployeeAppStats {
  totalUsers: number;
  activeUsers: number;
  pendingActivations: number;
  suspendedUsers: number;
  activeToday: number;
  pendingRequests: number;
  totalAnnouncements: number;
  iosCount: number;
  androidCount: number;
  webCount: number;
  biometricAdoptionRate: number;
}
