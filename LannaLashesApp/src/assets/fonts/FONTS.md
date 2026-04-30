# Required Fonts

Download these font files and place them in this directory.

## Inter Tight (headings, labels, UI)
Source: https://fonts.google.com/specimen/Inter+Tight

Required weights:
- InterTight-Regular.ttf
- InterTight-Medium.ttf
- InterTight-SemiBold.ttf
- InterTight-Bold.ttf

## Inter (body text)
Source: https://fonts.google.com/specimen/Inter

Required weights:
- Inter-Regular.ttf
- Inter-Medium.ttf

## After downloading

Run this command to link fonts to iOS and Android:

```bash
npx react-native-asset
```

This copies fonts into:
- iOS: `ios/LannaLashes/fonts/`
- Android: `android/app/src/main/assets/fonts/`
