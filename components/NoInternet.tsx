import { Theme } from '@/constants/Colors';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

interface NoInternetProps {
    refreshCallback : () => void,
}

export default function NoInternetView({refreshCallback} : NoInternetProps) {
	const [fontsLoaded] = useFonts({
		'SpaceMono-Bold' : require("../assets/fonts/SpaceMono-Bold.ttf"),
	});

	useEffect(() => {}, [fontsLoaded]);

  return <>
		<SafeAreaView style={{flex:1}}>
			<View style={[Theme.body, {flex:1, justifyContent:'center', alignItems:'center'}]}>
				<Text style={[Theme.title, {fontFamily:'SpaceMono-Bold', marginHorizontal:15, fontSize:20}]}>
					Check your Internet connection and try again
				</Text>
				<TouchableOpacity onPress={() => refreshCallback()}>
					<View style={[Theme.button]}>
						<Text style={{fontFamily:'SpaceMono-Bold'}}>Refresh</Text>
					</View>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	</>
}