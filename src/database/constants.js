/**
 * Storage Keys for LocalStorage / AsyncStorage
 * Separated to prevent circular dependencies between storage.js and cloudSync.js
 */
export const STORAGE_KEYS = {
  MEMBERS: '@rural_health_members',
  FAMILIES: '@rural_health_families',
  SYNC_QUEUE: 'asha_sync_queue',
  TASKS: 'asha_tasks',
  CLAIMS: 'asha_claims',
  TASK_COMPLETIONS: 'asha_task_completions',
  APP_CONFIG: 'asha_app_config',
  LOCKED_PERIODS: 'asha_locked_periods',
  VILLAGES: '@rural_health_villages',
  USERS: '@rural_health_users',
  PHCS: '@rural_health_phcs',
  SUB_CENTERS: '@rural_health_subcenters',
  DELETED_IDS: 'asha_deleted_ids',
  VHND_SESSIONS: '@rural_health_vhnd',
  VITAL_EVENTS: '@rural_health_vital_events',
};
