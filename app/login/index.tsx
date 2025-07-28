import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomButton } from '@/components/Button';
import { Colors, Theme } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated, Dimensions, Image, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import PagerView from 'react-native-pager-view';

import UserProfile from '@/constants/UserProfile';

export default function LoginPage()
{
  const [fontsLoaded] = useFonts({
    "Roboto" : require("../../assets/fonts/Roboto.ttf"),
    'SpaceMono' : require("../../assets/fonts/SpaceMono-Regular.ttf"),
    'SpaceMono-Bold' : require("../../assets/fonts/SpaceMono-Bold.ttf"),
  });

  const height = Dimensions.get('screen').height;
  const loginButtonPosition = useRef(new Animated.Value(200)).current;
  const titlePosition = useRef(new Animated.Value(height)).current;
  const descriptionAnimation = useRef(new Animated.Value(0)).current;

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

  const pagerRef = useRef<PagerView>(null);

  const currentPage = useRef(0);
  const router = useRouter();

  const pagesContent = useRef([
    ["🎙️ Natural AI voiceovers", "\"Sounds human, not robotic\"", "0"],
    ["🎞️ Auto video editing", "\"Crafted for TikTok, Reels & YT\"", "1"],
    ["📤 Easy to share", "\"From Reddit to your audience fast\"", "2"]
  ]);

  const nextPage = () => {
    pagerRef.current?.setPage(currentPage.current);
    currentPage.current = (currentPage.current + 1) % pagesContent.current.length;
  };

  useEffect(() => {
    const intervalId = setInterval(nextPage, 2500);
    return () => clearInterval(intervalId); // clean on unmount
  }, []); //

  const [logging, setLogging] = useState(false);

  const handleLogin = async () => {
    const userProfile:UserProfile = {
      joined : new Date(),
      orderId : '',
      result : [],
      userId : 'md',
      username : 'Mohammed Rawashdeh',
      tokens : 150
    };

    AsyncStorage.setItem('user', JSON.stringify(userProfile));
    router.replace({pathname : "/home", params : {name : "Mohammed Rawashdeh"}});
  }


  return <>
    <SafeAreaView style={{flex:1, padding : 5}}>
      <View style={{flex:1}}>
        <Animated.View style={{transform : [ {translateY : titlePosition } ]}}>
          <View style={{backgroundColor : Colors.primary, padding : 0, width : 'auto', borderRadius : 35, 
            flexDirection : 'row', alignItems : 'center', marginHorizontal : 15}}>
            <Image source={require("../../assets/images/redcast_logo.png")} style={{width:100, height:  100}} />
            <Text style={[Theme.title, {color : Colors.surface, flex : 1, textAlign : 'left', marginLeft : 20}]}>RedCast</Text>
          </View>
        </Animated.View>
        <Animated.View style={{opacity : descriptionAnimation}}>
          <Text style={{fontWeight : '800', color : Colors.primary, fontSize : 25, marginHorizontal : 20, marginTop : 20, 
            textAlign : 'center', flexWrap:'wrap'
          }}>
            “Turn Reddit stories into captivating voiceover videos — powered by AI.”
          </Text>
        </Animated.View>
        <Animated.View style={{opacity : descriptionAnimation, flex : 1, marginHorizontal : 0, marginTop : 25,}}>
          <PagerView initialPage={0} style={{flex:1, marginBottom : 15}} ref={pagerRef}>
            {pagesContent.current.map(item => {
              return <View key={item[2]} style={[Theme.genericShadow, {justifyContent : 'center', 
                alignItems : 'center', backgroundColor : Colors.secondary, borderRadius : 25, marginHorizontal : 20,
                marginVertical : 10}]}>
                <View style={{flex:1, justifyContent : 'center'}}>
                  <Text style={{color : Colors.primary, fontWeight : '800', fontFamily : 'SpaceMono-Bold', 
                    fontSize : 30, marginHorizontal : 25, textAlign : 'center' }}>
                    {item[0]}
                  </Text>
                </View>
                <View style={{flex:1, justifyContent:  'center'}}>
                  <Text style={{color : Colors.primary, fontWeight : '400', fontFamily : 'SpaceMono-Bold', 
                    fontSize : 20, marginHorizontal : 25, textAlign : 'center' }}>
                    {item[1]}
                  </Text>
                </View>
                {/* <Text style={{color : Colors.primary, fontWeight : '800', fontFamily : 'SpaceMono-Bold', 
                  fontSize : 30, marginHorizontal : 25, textAlign : 'center', flex:1, justifyContent : 'center',
                  alignItems : 'center'}}>
                  {item[0]}
                </Text>
                <Text style={{color : Colors.primary, fontWeight : '400', fontFamily : 'SpaceMono-Bold', 
                  fontSize : 20, marginHorizontal : 25, textAlign : 'center', flexWrap:'wrap', flex:1, justifyContent : 'center',
                    alignItems : 'center'}}>
                  {item[1]}
                </Text> */}
              </View>
            })}
          </PagerView>
        </Animated.View>
      </View>
      <Animated.View style={{transform : [{translateY : loginButtonPosition}]}}>
        <Text style={{color : Colors.primary, fontWeight : '600', textAlign : 'center', fontFamily : 'Roboto', fontSize : 16}}>
          Login / Signup - {logging ?  "Loggin in " : "Not loggin in"}
        </Text>
        <CustomButton onPress={() => handleLogin()} style={{alignItems : 'center', flexDirection:'row', gap : 15, justifyContent : 'flex-start'}}>
          <Image source={require('../../assets/images/google.webp')} style={{width:30, height : 30}}/>
          <Text style={[Theme.buttonText]}>Login with Google</Text>
        </CustomButton>
      </Animated.View>
    </SafeAreaView>
  </>
}