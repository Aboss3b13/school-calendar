# SchoolFlow Planner (Android)

An all-in-one school organizer app for phone + tablet with iCal sync, exam tracking, study tasks, and OneNote-style notes (typed + handwriting).

## Highlights

- **Live school calendar sync via iCal URL**
- **Automatic exam detection** from event titles/descriptions
- **Dashboard command center** with next class, upcoming exams, open tasks, notes count
- **Monthly calendar view** with marked school events
- **Task manager** with priorities, due dates, subjects, completion states
- **Professional notes system**
  - Typed notes
  - Stylus handwriting capture (great for Lenovo Yoga Tab Plus pen usage)
  - Tags, pinning, and quick organization
- **Fully bilingual**: English + German switch at runtime
- **Customization**: dark/light/system mode, accent colors, compact UI mode, editable iCal URL
- **Offline-first local persistence** using AsyncStorage

## Included iCal default

The app already ships with your URL as default:

`https://www.schulnetz-ag.ch/aksa/cindex.php?longurl=5XKkSde4FzY2rCj37SGEwhv6b97K06tNTfocNn9FeReXWa2VQQ7PU3PuyXaKJ9dx`

You can still change it anytime in **Settings**.

## Quick start (development)

1. Install dependencies:

```bash
npm install
```

2. Start Expo:

```bash
npm run start
```

3. Run on Android:

```bash
npm run android
```

## Build downloadable APK (recommended)

This project is configured with `eas.json` for APK output.

1. Install EAS CLI:

```bash
npm install -g eas-cli
```

2. Login:

```bash
eas login
```

3. Build APK in cloud:

```bash
eas build -p android --profile preview
```

4. Open the build URL from the terminal and download the generated APK.

## Publish to your GitHub repo

Target repo:

`https://github.com/Aboss3b13/school-calendar`

If not already linked, run:

```bash
git remote remove origin
git remote add origin https://github.com/Aboss3b13/school-calendar.git
git add .
git commit -m "feat: initial SchoolFlow Planner app"
git branch -M main
git push -u origin main
```

> You may be prompted to authenticate with GitHub (PAT or browser login).

## Tech stack

- Expo + React Native + TypeScript
- React Navigation (bottom tabs)
- i18next + react-i18next + expo-localization
- react-native-calendars
- react-native-signature-canvas + react-native-webview
- AsyncStorage
- iCal parsing with `ical.js`

## Notes

- Handwriting capture is stored as data URL in note records.
- For the smoothest pen experience on tablet, use a stylus-friendly screen protector and keep your Android touch/pen firmware updated.
