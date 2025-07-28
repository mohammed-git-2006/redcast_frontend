import { Colors, Theme } from "@/constants/Colors";
import UserProfile from "@/constants/UserProfile";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Modal from 'react-native-modal';
import PagerView from "react-native-pager-view";

const styles = StyleSheet.create({
  headerText : {
    color : Colors.primary, 
    fontFamily:'SpaceMono-Bold',
    fontSize : 15
  },

  pagerViewElement : {
    height : 100,
    backgroundColor : Colors.pg,
    borderRadius:15,
    borderColor:'black',
    margin:10,
    padding:15,
    justifyContent:'space-between'
  },

  pvTitle : {
    fontFamily : 'SpaceMono-Bold',
    fontWeight:700,
    textAlign:'left',
    fontSize:20,
    color: Colors.primary
  },

  pvSub : {
    fontFamily : 'SpaceMono',
    fontWeight:400,
    textAlign:'right',
    fontSize: 14,
    color: Colors.primary
  },

  input : {
    backgroundColor:Colors.pg,
    borderRadius:15,
    padding:10,
    marginHorizontal:10,
    height:200,
    borderColor:Colors.primary,
    borderWidth:2,
    fontFamily:'SpaceMono-Bold',
    color:Colors.primary,
    fontSize:14
  }
})

export default function Home() {
  const { name } = useLocalSearchParams();

  const [fontsLoaded] = useFonts({
    "Roboto" : require("../../assets/fonts/Roboto.ttf"),
    'SpaceMono' : require("../../assets/fonts/SpaceMono-Regular.ttf"),
    'SpaceMono-Bold' : require("../../assets/fonts/SpaceMono-Bold.ttf"),
  });

  const pagerViewElements = useRef([
    {
      title: '🧠 Create Content with AI',
      subtitle: 'Turn ideas into videos in seconds',
    },
    {
      title: '🎤 Voiceovers in Seconds',
      subtitle: 'Realistic AI voices that speak your story',
    },
    {
      title: '📱 Share Anywhere, Instantly',
      subtitle: 'Perfect for Reels, Shorts, and TikToks',
    },    
  ]).current;

  const [loading, setLoading] = useState(true);
  const [tokensModalVisibile, setTokensModalVisibility] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const maxCharacters = useRef(1000).current;
  const [userScript, setUserScript] = useState("");
  const pagerRef = useRef(null);
  const currentPage = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem('user').then(r => {
      setUserProfile(JSON.parse(r??'{}'));
      setLoading(false);
    })
  }, [fontsLoaded]);

  const nextPage = () => {
    pagerRef.current?.setPage(currentPage.current);
    currentPage.current = (currentPage.current + 1) % pagerViewElements.length;
  };

  useEffect(() => {
    const intervalId = setInterval(nextPage, 2500);
    return () => clearInterval(intervalId); // clean on unmount
  }, []); //

  const viewTokens = () => {
    setTokensModalVisibility(true);
  }

  const handleInputChange = (newText:string) => {
    setUserScript(newText);
  }

  return loading ? <>
    <View style={{justifyContent : 'center', alignItems : 'center', flex:1}}>
      <ActivityIndicator size={500} color={Colors.secondary} style={{width:150, height:150}}>
      </ActivityIndicator>
    </View>
  </> : <>
    <View style={[Theme.body]}>
      <View style={{backgroundColor : Colors.secondary, padding : 15, paddingTop:20}}>
        <SafeAreaView style={{flexDirection:'row', gap:5, justifyContent:'space-between', alignItems:'center'}}>
          <Text style={[styles.headerText, {fontSize:18}]}>{userProfile.username}</Text>
          <TouchableOpacity onPress={() => viewTokens()}>
            <View style={{flexDirection:'row', gap:5, justifyContent:'center', alignItems:'center',
              padding:5,borderColor:Colors.primary, borderWidth:2, borderRadius:15
            }}>
              <Image source={require('../../assets/images/token.png')} 
                style={{width:15, height:15, tintColor:'white', resizeMode:'contain'}}/>
              <Text style={[styles.headerText, {fontWeight:'800'}]}>{userProfile.tokens?.toString()}</Text>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
      <ScrollView style={{flex:1}}>
        <PagerView initialPage={0} style={{height:120, padding:0}} ref={pagerRef}>
          {pagerViewElements.map(e => {
            return <View style={[styles.pagerViewElement]} key={e.title}>
              <Text style={[styles.pvTitle]}> {e.title} </Text>
              <Text style={[styles.pvSub]}> {e.subtitle} </Text>
            </View>
          })}
        </PagerView>
        <TextInput maxLength={maxCharacters} style={[styles.input]} cursorColor={Colors.primary}  
          multiline={true} placeholder="Paste your script here ..." selectionColor={Colors.primary}
          onChangeText={(newTex) => handleInputChange(newTex)}
          />
        <Text style={{color: userScript.length == maxCharacters ? 'red' : 'white', fontFamily:'SpaceMono-Bold', marginHorizontal:15}}>
          {userScript.length}/{maxCharacters}
        </Text>

        <TouchableOpacity onPress={() => router.push({
            pathname: "/generateScript",
            params: {
              user: JSON.stringify(userProfile)
            }
          })}>
          <View style={{backgroundColor:Colors.secondary, borderRadius:15, padding:15, alignItems:'center', justifyContent:'center',
            marginHorizontal:15, marginVertical:5
          }}>
            <Text style={{fontFamily:'SpaceMono-Bold', color:Colors.primary}}>Generate script with AI 🖋️ 📄</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal isVisible={tokensModalVisibile} style={{flex:1}}>
        <View style={{backgroundColor : Colors.pg, borderRadius:15, padding:15, margin:0, height:'60%'}}>
          <View style={{position:'absolute', transform:[{translateX:-8}, {translateY:8}], alignSelf:'flex-end'}}>
            <TouchableOpacity onPress={() => setTokensModalVisibility(false)}>
              <Ionicons name="close-circle" size={30} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            {/* <Text style={[Theme.buttonText, {color:Colors.primary}]}>
              Tokens you have : {userProfile.tokens?.toString()}
            </Text> */}
            <Image source={require('../../assets/images/buy_tokens.png')} style={{
              width:'80%'
            }} resizeMode='contain' />
          </View>

          <TouchableOpacity onPress={() => setTokensModalVisibility(false)}>
            <View style={[Theme.button]}>
              <Text style={{fontFamily:'SpaceMono-Bold', color:Colors.surface}}>Buy Tokens now!</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  </>
}