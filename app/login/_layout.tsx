import { Theme } from '@/constants/Colors'
import { Slot } from 'expo-router'
import { View } from 'react-native'

export default function LoginRoot() {

  return <>
    <View style={[Theme.body]}>
      <Slot/>
    </View>
  </>
}