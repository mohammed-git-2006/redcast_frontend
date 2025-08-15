import { Theme } from '@/constants/Colors';
import { useFonts } from 'expo-font';
import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

interface NoInternetProps {
    refreshCallback : () => void,
}

export default function NoInternetView({refreshCallback} : NoInternetProps) {
	const [fontsLoaded] = useFonts({
		'montserrat' : require("../assets/fonts/montserrat.ttf"),
	});

	useEffect(() => {}, [fontsLoaded]);

  return <>
		<SafeAreaView style={{flex:1}}>
			<View style={[Theme.body, {flex:1, justifyContent:'center', alignItems:'center'}]}>
				<LottieView source={require('@/assets/lottie/no_internet.json')} style={{width:250, height:250}} />
				<Text style={[Theme.title, {fontFamily:'montserrat', marginHorizontal:15, fontSize:20, width:'80%', marginBottom:25}]}>
					Check your Internet connection and try again
				</Text>
				<TouchableOpacity onPress={() => refreshCallback()}>
					<View style={[Theme.button]}>
						<Text style={{fontFamily:'montserrat', fontWeight:'800'}}>Refresh</Text>
					</View>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	</>
}