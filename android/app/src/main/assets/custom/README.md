# Montserrat Font Files

## Required Font Files

Download the following Montserrat font files from Google Fonts (https://fonts.google.com/specimen/Montserrat) and place them in this directory:

- **Montserrat-Regular.ttf** (400 weight)
- **Montserrat-Medium.ttf** (500 weight)
- **Montserrat-SemiBold.ttf** (600 weight)
- **Montserrat-Bold.ttf** (700 weight)

## Steps to Add Fonts

1. Visit: https://fonts.google.com/specimen/Montserrat
2. Click "Download family"
3. Extract the downloaded ZIP file
4. Copy the following files from the `static` folder to this directory:
   - Montserrat-Regular.ttf
   - Montserrat-Medium.ttf
   - Montserrat-SemiBold.ttf
   - Montserrat-Bold.ttf
5. Run: `npx react-native-asset` to link fonts
6. Rebuild the app for changes to take effect

## Font Usage in Code

```typescript
fontFamily: 'Montserrat-Regular'  // 400
fontFamily: 'Montserrat-Medium'   // 500
fontFamily: 'Montserrat-SemiBold' // 600
fontFamily: 'Montserrat-Bold'     // 700
```

## After Adding Fonts

After placing the font files here, run:
```bash
npx react-native-asset
```

This will automatically link the fonts to both iOS and Android projects.
