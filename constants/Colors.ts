/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { StyleSheet } from "react-native";

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// export const Colors = {
//   light: {
//     text: '#11181C',
//     background: '#fff',
//     tint: tintColorLight,
//     icon: '#687076',
//     tabIconDefault: '#687076',
//     tabIconSelected: tintColorLight,
//   },
//   dark: {
//     text: '#ECEDEE',
//     background: '#151718',
//     tint: tintColorDark,
//     icon: '#9BA1A6',
//     tabIconDefault: '#9BA1A6',
//     tabIconSelected: tintColorDark,
//   },
// };

const Colors = {
  surface : '#212121', // D11900
  primary : '#FFFCFB',
  secondary : '#D11900',
  pg : '#113F67'
};

const fontFamily = 'Roboto';


const Theme = StyleSheet.create({
  body : {
    backgroundColor : Colors.surface,
    color : Colors.primary,
    flex: 1,
    flexDirection: 'column'
  },

  title : {
    color : Colors.primary,
    fontFamily : fontFamily,
    fontWeight : 'bold',
    fontSize : 35,
    textAlign : 'center'
  },

  header : {
    color : Colors.primary,
    fontFamily : fontFamily,
    fontWeight : 'normal',
    fontSize : 20,
    textAlign : 'center'
  },

  pagerViewChild : {
    padding : 15,
    justifyContent : 'flex-start',
    alignItems : 'center'
  },

  pagerViewImage : {
    width : '100%',
    height : 'auto',
    borderRadius : 25,
    borderColor : Colors.primary,
    borderWidth : 5,
  },

  button : {
    backgroundColor : Colors.primary,
    borderRadius : 15,
    padding : 15,
    marginHorizontal : 20,
    marginVertical : 10,
    alignItems : 'center'
  },

  buttonText : {
    color : 'black',
    fontWeight : '800',
    fontSize : 18
  },

  genericShadow : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 4,

    // Android Shadow
    elevation: 5,
  }
})

export { Colors, Theme };

