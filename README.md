# SchoolFlow Planner (Android)

An all-in-one school organizer app for phone + tablet with iCal sync, exam tracking, study tasks, and OneNote-style notes (typed + handwriting).

## Highlights

- **Live school calendar sync via iCal URL**
- **Automatic exam detection** from event titles/descriptions
- **Dashboard command center** with next class, upcoming exams, open tasks, notes count
- **Monthly calendar view** with marked school events
- **Advanced calendar sorting** by event type (lesson/event/exam), subject, and date
- **Upcoming exams first** with expandable past-exam history
- **Task manager** with priorities, due dates, subjects, completion states
- **Professional OneNote-style notes system**
  - Typed notes
  - Stylus handwriting capture (great for Lenovo Yoga Tab Plus pen usage)
  - Notebooks + sections + templates
  - Tags, favorites, pinning, checklist items, color coding, fast filtering
- **Swiss grade calculator**
  - Official grade tracking + separate playground simulation
  - Weighted average grade (1–6 scale)
  - Subject-specific averages (subjects stay separate)
  - Combined all-subject average with configurable per-subject weights (default = 1)
  - Points-to-grade conversion and target-grade point calculator
- **Android home-screen widget support**
  - SchoolFlow overview widget
  - Calendar widget (today + next event)
  - Next test widget
  - Quick grade widget (official average + open tasks)
  - In-app widget preview and live sync toggle
- **Fully bilingual**: English + German switch at runtime
- **Customization**: dark/light/system mode, accent colors, compact mode, card styles, font scale, animation toggle, widget sync toggle, editable iCal URL
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

## GitHub APK releases (versioned)

The GitHub Actions workflow now publishes a **new versioned release tag** for each build:

- Tag format: `v1.<run_number>`
- APK file format: `SchoolFlow-Planner-v1.<run_number>.apk`
- Previous APK releases are kept (not replaced/deleted)

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
- react-native-android-widget
- AsyncStorage
- iCal parsing with `ical.js`

## Notes

- Handwriting capture is stored as data URL in note records.
- For the smoothest pen experience on tablet, use a stylus-friendly screen protector and keep your Android touch/pen firmware updated.
