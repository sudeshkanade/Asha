# Rural Health APK - Architecture & Prototype

This project is an offline-first Android application designed for village-level health workers to track family health data, maternal health, and vaccinations.

## Architecture Highlights
- **Offline-First**: Local storage using SQLite with a sync queue for Firebase/PostgreSQL integration.
- **Relational Data**: Family-Member-Tracker linkage for complex reporting.
- **Village Filtering**: Automatic data filtering based on the logged-in user's assigned village.
- **Automated Logic**: HBNC/HBYC scheduling and intelligent auto-population of names.

## Project Structure
- `src/screens`: UI components for Login, Registration, and Dashboards.
- `src/database`: SQL schema and database access logic.
- `src/utils`: Business logic for health tracking (Age, Scheduling, Validation).
- `src/constants`: Design system and color palettes.

## Next Steps
1. **Initialize Expo**: Run `npx create-expo-app .` (requires Node.js).
2. **Install Dependencies**: 
   - `expo-sqlite` for local DB.
   - `@react-navigation/native` for routing.
   - `firebase` or `supabase-js` for backend sync.
3. **Database Hookup**: Implement the SQLite wrapper in `src/database` using the provided `schema.sql`.

## 🌐 Web Deployment & PWA
This app is designed for "Web-First" deployment:
1. **Deploy as PWA**: Run `npx expo export:web` and host the `web-build` folder.
2. **Offline Persistence**: Uses `src/database/storage.js` to automatically cache data in the browser's IndexedDB/LocalStorage.
3. **Add to Home Screen**: Workers can install the app directly from Chrome/Safari without an APK.
