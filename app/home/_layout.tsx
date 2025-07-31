import { themeProvider } from '@/constants/Colors'
import { ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'

export default function LoginRoot() {
  return <>
    <ThemeProvider value={themeProvider}>
      <Stack screenOptions={{headerShown : false}} />
    </ThemeProvider>
  </>
}