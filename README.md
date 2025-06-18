# Jalsa Map Project

A cross-platform mapping application built with React (web) and React Native (mobile) using Mapbox for location services.

## Features

- **Real-time Location Tracking**: Shows user's current location with Google Maps-style pulsing blue dot
- **Cross-platform**: Web (React) and Mobile (React Native with Expo)
- **Interactive Maps**: Powered by Mapbox with navigation controls
- **Live Updates**: Continuous location tracking with smooth animations
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Project Structure

```
jalsa-map-project/
├── web/                 # React web application
│   ├── src/
│   ├── public/
│   └── package.json
├── mobile/              # React Native mobile application
│   ├── src/
│   ├── ios/
│   ├── android/
│   └── package.json
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Mapbox account and access token
- For mobile development:
  - Expo CLI
  - iOS Simulator (for iOS development)
  - Android Studio (for Android development)

## Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd jalsa-map-project
```

### 2. Configure Mapbox
1. Get your Mapbox access token from [Mapbox Account](https://account.mapbox.com/)
2. Update the token in both projects:
   - `web/src/config.ts`
   - `mobile/src/config.ts`

### 3. Web Application Setup
```bash
cd web
npm install
npm start
```
The web app will be available at `http://localhost:3000`

### 4. Mobile Application Setup
```bash
cd mobile
npm install
```

#### For iOS:
```bash
npx expo run:ios
```

#### For Android:
```bash
npx expo run:android
```

#### For Web (mobile app):
```bash
npx expo start --web
```

## Usage

1. **Location Permission**: Grant location permissions when prompted
2. **Live Tracking**: Your location will be displayed as a pulsing blue dot
3. **Navigation**: Use the map controls to zoom, pan, and navigate
4. **Real-time Updates**: The map will follow your location as you move

## Technologies Used

- **Frontend**: React, TypeScript
- **Mobile**: React Native, Expo
- **Maps**: Mapbox GL JS, @rnmapbox/maps
- **Styling**: CSS3, React Native StyleSheet

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository. 