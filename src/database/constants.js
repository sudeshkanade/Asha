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
  STOCK: '@rural_health_stock',
  IDSP_SURVEILLANCE: '@rural_health_idsp',
  VECTOR_SURVEYS: '@rural_health_vector',
  HWC_ACTIVITY: '@rural_health_hwc',
  WATER_QUALITY: '@rural_health_water',
  COLD_CHAIN: '@rural_health_cold_chain',
  CUSTOM_FORM_SCHEMAS: '@rural_health_custom_schemas',
  CUSTOM_EVENTS: '@rural_health_custom_events',
  ALERTS: '@rural_health_alerts',
  // BUG-M1 FIX: Named constant prevents magic string repetition across files
  PHC_SUMMARY: 'PHC_SUMMARY',
};

/**
 * BUG-M2 / OPT-5 FIX: Only clinical collections can contain soft-deleted records.
 * Used by cleanupTombstones and autoPrune to avoid scanning all 27 storage keys.
 */
export const CLINICAL_KEYS = [
  STORAGE_KEYS.MEMBERS,
  STORAGE_KEYS.FAMILIES,
  STORAGE_KEYS.VITAL_EVENTS,
  STORAGE_KEYS.CLAIMS,
  STORAGE_KEYS.TASK_COMPLETIONS,
  STORAGE_KEYS.VHND_SESSIONS,
  STORAGE_KEYS.STOCK,
  STORAGE_KEYS.CUSTOM_EVENTS,
  STORAGE_KEYS.ALERTS,
];

