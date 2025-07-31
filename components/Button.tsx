import { ReactNode } from 'react';
import { GestureResponderEvent, Text, TouchableOpacity, View, ViewStyle } from "react-native";

import { Theme } from '@/constants/Colors';

type MyButtonProps =
{
  onPress : (event : GestureResponderEvent) => void;
  children : ReactNode,
  style? : ViewStyle,
  available? : boolean
};

export function CustomButton({onPress , children, style, available} : MyButtonProps) {
  return <>
    <TouchableOpacity disabled={!available} onPress={onPress} style={[Theme.genericShadow]}>
      <View style={[Theme.button, style]}>
        {children}
      </View>
    </TouchableOpacity>
  </>
}

export function TextButton({onPress, children} : MyButtonProps) {
  return <CustomButton onPress={onPress}><Text>{children}</Text></CustomButton>
}