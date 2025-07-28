
import { Theme } from '@/constants/Colors'
import { Slot } from 'expo-router'
import { View } from 'react-native'

export default function GenRoot() {

  return <>
    <View style={[Theme.body]}>
      <Slot/>
    </View>
  </>
}