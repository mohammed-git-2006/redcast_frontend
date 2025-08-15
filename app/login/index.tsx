import { CustomButton } from '@/components/Button';
import { Colors, Theme } from '@/constants/Colors';
import { SERVER_URL } from '@/constants/UserProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
WebBrowser.maybeCompleteAuthSession();

import LoadingComponent from '@/components/LoadingComponent';
import Modal from 'react-native-modal';

const AUTH_REDIRECT_URL = "https://auth.expo.io/@mohammedrawashdeh/RedCast"

interface BackendAuth 
{
  username : string,
  token : string,
  email : string
}

interface BackendResponse 
{
  status: boolean,
  token : string,
  firstTime : boolean
}

export default function LoginPage()
{
  const [fontsLoaded] = useFonts({
    // "Roboto" : require("../../assets/fonts/Roboto.ttf"),
    // 'SpaceMono' : require("../../assets/fonts/SpaceMono-Regular.ttf"),
    'montserrat' : require("../../assets/fonts/montserrat.ttf"),
  });

  const height = Dimensions.get('screen').height;
  const loginButtonPosition = useRef(new Animated.Value(200)).current;
  const titlePosition = useRef(new Animated.Value(height)).current;
  const descriptionAnimation = useRef(new Animated.Value(0)).current;
  const [loadingModalVisibile, setLoadingModalVisibile] = useState(false)

  useEffect(() => {

  }, [fontsLoaded]);

  useEffect(() => {
    Animated.timing(loginButtonPosition, {
      useNativeDriver : true,
      toValue : 0,
      duration : 1000
    }).start();

    Animated.timing(titlePosition, {
      useNativeDriver : true,
      toValue : 0,
      duration : 1000,
      delay:  1000
    }).start(); // descriptionAnimation

    Animated.timing(descriptionAnimation, {
      useNativeDriver : true,
      toValue : 1,
      duration : 500,
      delay:  2000
    }).start();
  }, []);

  const router = useRouter();

  const [logging, setLogging] = useState(false);

  const [request, response, asyncPrompt] = Google.useAuthRequest({
    clientId:'1076352697541-ue3ongqtggen8khddndsg3fic7vev9u9.apps.googleusercontent.com',
    redirectUri: AUTH_REDIRECT_URL,
    scopes:[]
  });
  
  useEffect(() => {
    if (response == null) {
      return;
    }

    if (response?.type == 'cancel') return;
    if (response?.type == "success") {
      alert("Response SUCCESS");
    } else {
      alert("Login process failed, please try again later ".concat(response?.type))
    }
  }, [response])

  const handleLogin_ = () => {
    // router.replace('/preview')
    // asyncPrompt();
    // alert(makeRedirectUri( { useProxy : true } ))
  }

  const handleLogin = async () => {
    setLogging(true)
    fetch(`${SERVER_URL}/auth/google`, {
      method:'POST',
      headers : {
        'Content-type' : 'application/json'
      },
      body : JSON.stringify({
        email : 'mdrawashdeh2006@gmail.com',
        token : 'SIMPLE_TOKEN',
        username : 'Mohammed Rawashdeh'
      } as BackendAuth)
    }).then(async fR => {
      const jsonResponse = await fR.json() as BackendResponse
      if (!jsonResponse.status) {
        alert('Error while trying to login, try again later');
        return;
      }

      await AsyncStorage.setItem('token', jsonResponse.token)
      router.replace(jsonResponse.firstTime ? '/preview' : '/home')
    }).catch(error => {
      alert(`DevErr : ${error}`)
      setLogging(false)
    })
  }

  return <>
    <SafeAreaView style={{flex:1, padding : 5}}>
      <View style={{flex:1}}>
        <Animated.View style={{transform : [ {translateY : titlePosition } ]}}>
          <View style={{backgroundColor : Colors.primary, padding : 0, width : 'auto', borderRadius : 35, 
            flexDirection : 'row', alignItems : 'center', marginHorizontal : 15}}>
            <Image source={require("../../assets/images/redcast_logo.png")} style={{width:100, height:  100}} />
            <Text style={[Theme.title, {color : Colors.surface, flex : 1, textAlign : 'left', marginLeft : 20, fontFamily:'montserrat'}]}>RedCast</Text>
          </View>
        </Animated.View>
        <Animated.View style={{opacity : descriptionAnimation}}>
          <Text style={{fontWeight : '800', color : Colors.primary, fontSize : 20, marginHorizontal : 20, marginTop : 20, 
            textAlign : 'center', flexWrap:'wrap', fontFamily:'montserrat', width:'90%'
          }}>
            “Turn Reddit stories into captivating voiceover videos — powered by AI.”
          </Text>
        </Animated.View>
      </View>
      <Animated.View style={{transform : [{translateY : loginButtonPosition}]}}>
        <Text style={{color : Colors.primary, fontWeight : '600', textAlign : 'center', fontFamily : 'montserrat', fontSize : 16, marginVertical:2}}>
          Login / Signup
        </Text>
        <CustomButton available={!logging} onPress={() => handleLogin()} style={{alignItems: 'center', flexDirection:'row', gap:15, justifyContent : 'flex-start'}}>
          <Image source={require('../../assets/images/google.webp')} style={{width:30, height : 30}}/>
          <Text style={[Theme.buttonText, {fontFamily:'montserrat', flex:1}]}>Login with Google</Text>
        </CustomButton>
      </Animated.View>
      <Modal isVisible={logging}>
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          {/* <ActivityIndicator color={Colors.secondary} /> */}
          <LoadingComponent />
        </View>
      </Modal>
    </SafeAreaView>
  </>
}