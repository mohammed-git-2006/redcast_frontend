import { UserProfile } from "@/constants/UserProfile";
import { useFonts } from "expo-font";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, Text } from "react-native";


export default function GenerateTextPage() {

  const [fontsLoaded] = useFonts({
    'SpaceMono-Bold' : require('../../assets/fonts/SpaceMono-Bold.ttf')
  })

  const { user } = useLocalSearchParams();
  const userProfile:UserProfile = JSON.parse(user as string);
  return <>
    <SafeAreaView>
      <Text style={{color:'white', fontSize:25, fontFamily:'SpaceMono-Bold'}}>{userProfile.tokens?.toString()}</Text>
    </SafeAreaView>
  </>
}