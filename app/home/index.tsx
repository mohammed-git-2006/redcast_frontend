import NoInternetView from "@/components/NoInternet";
import VideoPreview from "@/components/VideoPreview";
import { Colors, Theme } from "@/constants/Colors";
import { db } from "@/constants/firebase";
import { loadUserFromServer, SERVER_URL, UserProfile } from "@/constants/UserProfile";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from 'expo-av';
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { onValue, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Easing, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Modal from 'react-native-modal';
import PagerView from "react-native-pager-view";
import getScriptFromUrl from "./reddit";

const styles = StyleSheet.create({
  headerText : {
    color : Colors.primary, 
    fontFamily:'montserrat',
    fontSize : 15
  },

  pagerViewElement : {
    height : 100,
    backgroundColor : Colors.primaryShade,
    borderRadius:15,
    borderColor:'black',
    margin:10,
    padding:15,
    justifyContent:'space-between'
  },

  pvTitle : {
    fontFamily : 'montserrat',
    fontWeight:800,
    textAlign:'left',
    fontSize:20,
    color: 'black'
  },

  pvSub : {
    fontFamily : 'SpaceMono',
    fontWeight:800,
    textAlign:'right',
    fontSize: 14,
    color: 'black'
  },

  input : {
    backgroundColor:Colors.inputSurface,
    borderRadius:20,
    padding:10,
    marginHorizontal:10,
    height:200,
    borderColor:Colors.primary,
    borderWidth:1,
    fontFamily:'montserrat',
    fontWeight:'600',
    color:'black',
    fontSize:14,
    shadowColor:'#686868ff',
    shadowRadius:5,
    shadowOpacity:1.0,
    shadowOffset:{width:0, height:0},
    marginBottom:5,
    elevation:5,
  }
})


interface VoicePair
{
  id : string,
  name : string,
}


interface ServerValues
{
  voices : VoicePair[],
  tokens_per_ad : number,
  tokens_per_100 : number,
  max_chars : number
}

interface GenerationRequest
{
  script : string,
  voiceId : string,
}

interface GenerationResponse
{
  status: boolean,
  msg : string,
  orderId : string,
}

export default function Home() {
  const [fontsLoaded] = useFonts({
    // "Roboto" : require("../../assets/fonts/Roboto.ttf"),
    // 'SpaceMono' : require("../../assets/fonts/SpaceMono-Regular.ttf"),
    'montserrat' : require("../../assets/fonts/montserrat.ttf"),
  });

  /**
   * Define states and references
   */
  const [loading, setLoading] = useState(true);
  const [connectionErr, setConnectionErr] = useState(false);
  const [tokensModalVisibile, setTokensModalVisibility] = useState(false);
  const [voiceIdModelVisibility, setVoiceIdModelVisibility] = useState(false); 
  const [redditVisibility, setRedditVisibility] = useState(false); 
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [maxCharacters, setMaxCharacters] = useState(1500);
  const [userScript, setUserScript] = useState("");
  const [calculatedLength, setCalculatedLength] = useState(0);
  const [tokensPerAd, setTokensPerAd] = useState(30);
  const [choosenVoice, setChoosenVoice] = useState<VoicePair|null>(null);
  const [voices, setVoices] = useState<VoicePair[]>();
  const [tokensPer100, setTokensPer100] = useState<number|null>()
  const [redditUrl, setRedditUrl] = useState("")
  const [gettingUrlContent, setGettingUrlContent] = useState(false);
  const [jwtToken, setJwtToken] = useState<string|null>(null)
  const pagerRef = useRef<PagerView>(null);
  const [generating, setGenerating] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string|null>(null)
  const [previewVideUrl, setPreviewVideoUrl] = useState<string|null>(null);
  const currentPage = useRef(0);
  const scriptInputRef = useRef<TextInput>(null)
  
  /**
   * Define animations references
   */
  const modalTokensRef = useRef(new Animated.Value(0)).current;
  const chooseVoiceRef = useRef(new Animated.Value(.0)).current;
  const redditButtonRef = useRef(new Animated.Value(.0)).current;
  const prevGensRef = useRef(new Animated.Value(.0)).current;
  const generateButtonRef = useRef(new Animated.Value(.0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(redditButtonRef, {
        useNativeDriver : true,
        toValue : 1.0,
        duration : 250,
        easing : Easing.out(Easing.ease),
      }),

      Animated.timing(prevGensRef, {
        useNativeDriver : true,
        toValue : 1.0,
        duration : 250,
        easing : Easing.out(Easing.ease),
      }),

      Animated.timing(chooseVoiceRef, {
        useNativeDriver : true,
        toValue : 1.0,
        duration : 250,
        delay : 0,
        easing : Easing.out(Easing.ease),
      }),

      Animated.timing(generateButtonRef, {
        useNativeDriver : true,
        toValue : 1.0,
        duration : 250,
        delay : 0,
        easing : Easing.out(Easing.ease),
      }),
    ]).start();
  }, [])

  useEffect(() => {
    if (tokensModalVisibile) {
      const _animationDuration = 1000;

      modalTokensRef.setValue(.5);

      Animated.spring(modalTokensRef, {
        useNativeDriver: true,
        toValue : 1,
        tension:100,
        friction:3,
      }).start();
    }
  }, [tokensModalVisibile])

  const loadServerValues = async () => {
    try {
      const fR = await fetch(`${SERVER_URL}/server_values`);
      const parsedResult : ServerValues = await fR.json()
      setVoices(parsedResult.voices)
      setChoosenVoice(parsedResult.voices[0])
      setTokensPerAd(parsedResult.tokens_per_ad)
      setMaxCharacters(parsedResult.max_chars)
      setTokensPer100(parsedResult.tokens_per_100)
    } catch (Ex) {
      // alert(`Error : ${Ex}`)
      setConnectionErr(true)
      setLoading(false)
    }
  }

  const loadPage = () => {
    AsyncStorage.getItem('token').then(jwtToken => {
      if (!jwtToken) {
        router.replace('/login');
        return;
      }

      loadUserFromServer(jwtToken).then(luR => {
        if (luR == 'connerr') {
          setConnectionErr(true)
          setLoading(false);
          return;
        }

        if (luR == 'tokenerr') {
          router.replace('/login')
          return;
        }

        setJwtToken(jwtToken)
        setCurrentOrderId(luR.orderId??'')

        setUserProfile(luR)
        setGenerating(luR.generating ?? false)
        loadServerValues().then(() => {
          setConnectionErr(false);
          setLoading(false);
        }).catch(err => {
          setConnectionErr(true);
          setLoading(false)
        })
      })
    })
  }

  useEffect(() => {
    loadPage();
  }, [fontsLoaded]);

  useEffect(() => {
    var newLength = userScript.length

    if(newLength > maxCharacters) {
      setUserScript(userScript.substring(0, maxCharacters))
      setCalculatedLength(maxCharacters)
    } else {
      setCalculatedLength(userScript.length)
    }
  }, [userScript]) // effect-userScript

  const [pagerViewElements, setPagerViewElements] = useState([
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
  ]);

  const charIndex = useRef(0);
  const intervalRef = useRef<number | null>(null);

  const nextPage = () => {
    currentPage.current = (currentPage.current + 1) % pagerViewElements.length;
    pagerRef.current?.setPage(currentPage.current)
  };

  

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      // interruptionModeIOS: Audio.,
      playsInSilentModeIOS: true,
      // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: true,
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(nextPage, 5000)
    return () => clearInterval(intervalRef.current!);
  }, []); // effect-mount

  const viewTokens = () => {
    setTokensModalVisibility(true);
  }

  const handleInputChange = (newText:string) => {
    // alert('Text change')
    setUserScript(newText);
  }

  const handleBuyTokens = () => {
    setTokensModalVisibility(false);
  }

  const handleWatchAd = () => {
    setTokensModalVisibility(false);
  }

  const [audioSample, setAudioSample] = useState<Audio.Sound|null>()

  const playVoiceSample = async (name:string) => {
    if (audioSample != null) {
      audioSample.stopAsync()
    }

    const {sound } = await Audio.Sound.createAsync(
      { uri : `${SERVER_URL}/voice/${name}/sample` },
      { shouldPlay : true }
    )

    setAudioSample(sound)
  } 

  const redditInputRef = useRef<TextInput>(null);

  const onRedditInputChanged = (newVal : string) => {
    setRedditUrl(newVal)
  }


  const updateTokens = () => {
    fetch(`${SERVER_URL}/user/tokens`, {
      headers : {
        'Authorization' : `Bearer ${jwtToken}`,
      }
    }).then(async fR => {
      try {
        // console.log(await fR.text())
        const newTokens = (await fR.json()).tokens
        setUserProfile({ ...userProfile, tokens:newTokens})
      } catch (err) {
        alert(err)
        // router.replace('/login')
      }
    }).catch(err => {
      setConnectionErr(true);
    })
  }

  const handleGenerate = () => {

    if (jwtToken == null) {
      router.replace('/login')
      return;
    }

    if (userScript.trim().length == 0) {
      if (scriptInputRef != null) scriptInputRef.current?.focus()
      return;
    }

    if ((calculatedLength / (tokensPer100??1)) > (userProfile.tokens ?? 0)) {
      setTokensModalVisibility(true);
      return;
    }

    setGenerating(true)
    setPreviewVideoUrl(null)
    console.log(`JWT token : ${jwtToken}`)
    fetch(`${SERVER_URL}/user/start`, {
      method:'POST',
      headers : {
        'Content-type' : 'application/json',
        'Authorization' : 'Bearer '.concat(jwtToken.trim())
      }, 

      body:JSON.stringify({
        script : userScript,
        voiceId : choosenVoice?.id
      } as GenerationRequest)
    }).then(async fR => {
      try {
        const jsonResponse = await fR.json() as GenerationResponse

        if (!jsonResponse.status) {
          throw jsonResponse.msg
        }

        setCurrentOrderId(jsonResponse.orderId);
        onValue(ref(db, jsonResponse.orderId), (snapshot) => {
          const val = snapshot.val()
          
          switch(val) {
          case "PREP":
            break;

          case "DONE":
            setGenerating(false)
            setPreviewVideoUrl(`${SERVER_URL}/order/${jsonResponse.orderId}/result`)
            break;

          case "ERR" :
            alert('Unknown error happend while generation');
            setGenerating(false);
          }

          updateTokens();
        })
        
      } catch (err) {
        setGenerating(false);
        if (String(err).startsWith('#')) {
          setTokensModalVisibility(true);
        } else {
          alert(err)
        }
      }
    }).catch(error => {
      alert(`DevErr : ${error}`)
      setGenerating(false);
    })
  }

  useEffect(() => {
    if (!voiceIdModelVisibility) {
      audioSample?.stopAsync();
    }
  }, [voiceIdModelVisibility])

  const handleRedditURL = () => {
   const checkUrl = () : boolean => {
    // https://www.reddit.com/r/AskReddit/comments/2eozyz/24_hours_adult_store_workers_of_reddit_what_are/

    const urlSplit:string[] = redditUrl.split('https://')
    console.log(urlSplit) 
    if (urlSplit.length < 2) return false;

    const locationSplit:string[] = urlSplit[1].split('/').filter(a => a.trim().length != 0)
    const domainName:string = locationSplit[0]
    const allowedDomains = ['www.reddit.com', 'reddit.com']
    var found = false;

    allowedDomains.forEach((a:string) => {
      if (a == domainName) found = true;
    })

    console.log(`found? ${found}`)

    if (!found) {
      return false;
    }

    return true;
   }
   
   console.log(`Checking the reddit url ...`)

   if (! checkUrl()) {
    alert("Enter a valid reddit url")
    return;
   }

   console.log(`Done checking !`)

   setGettingUrlContent(true)
   setTimeout(() => {setGettingUrlContent(false)}, 1500);
   getScriptFromUrl(redditUrl).then(r => {
    if (r == null) {
      alert ("Enter a valid reddit url");
      return;
    }

    setUserScript(r)
    setRedditVisibility(false);
   })
  }

  useEffect(() => {
    if(redditVisibility) {
      redditInputRef.current?.focus();
    }
  }, [redditVisibility]) // effect-redditVisibility

  const width = Dimensions.get('window').width

  return loading ? <>
    <View style={{justifyContent : 'center', alignItems : 'center', flex:1}}>
      <ActivityIndicator size={500} color={Colors.secondary} style={{width:150, height:150}}>
      </ActivityIndicator>
    </View>
  </> : connectionErr ? <>
    <NoInternetView refreshCallback={() => { setConnectionErr(false); setLoading(true); loadPage() }}/>
  </> : <>
    <View style={[Theme.body]}>
      <View style={{backgroundColor : Colors.secondary, padding : 15, paddingTop:20}}>
        <SafeAreaView style={{flexDirection:'row', gap:5, justifyContent:'space-between', alignItems:'center'}}>
          <Text style={[styles.headerText, {fontSize:15, marginTop:5, fontWeight:'800'}]}>👋 {userProfile.name}</Text>
          <TouchableOpacity onPress={() => viewTokens()}>
            <View style={{flexDirection:'row', gap:5, justifyContent:'center', alignItems:'center',
              padding:5,borderColor:Colors.primary, borderWidth:2, borderRadius:15
            }}>
              <Image source={require('../../assets/images/token.png')} 
                style={{width:15, height:15, tintColor:'white', resizeMode:'contain'}}/>
              <Text style={[styles.headerText, {fontWeight:'800', color:Colors.tokens}]}>{userProfile.tokens?.toFixed(1)}</Text>
              <Text style={{fontFamily:'montserrat', color:Colors.primary, fontWeight:'600'}}>Tokens</Text>
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
        <View style={{flexDirection:'row', marginHorizontal:15, marginBottom:10, justifyContent:'space-between'}}>
          <Text style={{color: Colors.primary, fontFamily:'montserrat'}}>
            <Text style={{color: Colors.tokens}}>{((userProfile.tokens??0) * (tokensPer100 ?? 0)).toFixed(1)}</Text> characters left
          </Text>
          <TouchableOpacity style={{flexDirection:'row', gap:3, alignItems:'center'}} onPress={() => setUserScript('')}>
            <Text style={{fontFamily:'montserrat', color:Colors.primary}}>Clear</Text>
            <Ionicons name="clipboard" style={{color:Colors.primary, transform : [{translateY:1}]}} />
          </TouchableOpacity>
        </View>
        <TextInput maxLength={maxCharacters} style={[styles.input]} cursorColor={Colors.surface}  
          multiline={true} placeholder="Paste your script here ..." selectionColor={Colors.surface}
          onChangeText={(newTex) => handleInputChange(newTex)} value={userScript} ref={scriptInputRef}
          />
        <Text>{previewVideUrl}</Text>
        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
          <Text style={{color: calculatedLength >= maxCharacters ? 'red' : 'white', fontFamily:'montserrat', marginHorizontal:15, fontWeight:'600'}}>
            {calculatedLength}/{maxCharacters}
          </Text>
          <Text style={{color: (calculatedLength / (tokensPer100??1)) > (userProfile.tokens ?? 0) ? 'red' : Colors.tokens, fontFamily:'montserrat', marginHorizontal:15, fontWeight:'600'}}>
            {calculatedLength / (tokensPer100??1)} Tokens
          </Text>
        </View>

        {previewVideUrl != null ? <>
        <View style={{justifyContent:'center', alignItems:'center', marginVertical:15}}>
          {/* <Video source={{uri : previewVideUrl!, headers : {
            'Authorization' : `Bearer ${jwtToken}`
          }}} useNativeControls style={{width:width*.8, height:width*1.42, borderRadius:20}} volume={1.0}  isMuted={false}
          onLoad={() => alert('Loaded')} onError={(e) => alert('Failed to load media '.concat(e))} PosterComponent={() => {
            return <ActivityIndicator />
          }} /> */}
          <VideoPreview 
            url={previewVideUrl}
            orderId={currentOrderId??''}
            width={Dimensions.get("window").width}
            token={jwtToken??''}
          />
        </View>
        </> : <>
        </>}

        
        <Animated.View style={{transform : [{ scale: redditButtonRef }]}}>
          <TouchableOpacity onPress={() => setRedditVisibility(true)}>
            <View style={{backgroundColor:Colors.secondary, borderRadius:15, padding:15, alignItems:'center', justifyContent:'space-between',
              marginHorizontal:15, marginVertical:5, flexDirection:'row'}}>
              <View style={{flexDirection:'row', gap:5}}>
                <Text style={{fontFamily:'montserrat', color:Colors.primary, fontWeight:'600'}}>
                  Use reddit URL
                </Text>
                <Ionicons name="logo-reddit" size={18} color={Colors.primary} style={{
                  transform : [{translateY:1}]
                }}/>
              </View>
              <Ionicons name="chevron-forward" style={{color : Colors.primary}} size={15}/>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{transform : [{ scale: prevGensRef }]}}>
          <TouchableOpacity onPress={() => router.navigate({pathname:'/home/previous_generations', params:{
            username : userProfile.name,
            jwtToken : jwtToken
          }})}>
            <View style={{backgroundColor:Colors.secondary, borderRadius:15, padding:15, alignItems:'center', justifyContent:'space-between',
              marginHorizontal:15, marginVertical:5, flexDirection:'row'}}>
              <View style={{flexDirection:'row', gap:5}}>
                <Text style={{fontFamily:'montserrat', color:Colors.primary, fontWeight:'600'}}>
                  Previous generations
                </Text>
                <Ionicons name="videocam-outline" size={18} color={Colors.primary} style={{
                  transform : [{translateY:2}]
                }}/>
              </View>
              <Ionicons name="chevron-forward" style={{color : Colors.primary}} size={15}/>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{transform : [{scale : chooseVoiceRef}]}}>
          <TouchableOpacity onPress={() => setVoiceIdModelVisibility(true)}>
            <View style={{backgroundColor:Colors.secondary, borderRadius:15, padding:5, alignItems:'center', justifyContent:'space-between',
              marginHorizontal:15, marginVertical:5, flexDirection:'row', paddingHorizontal:15}}>
              <Text style={{fontFamily:'montserrat', color:Colors.primary, fontWeight:'600'}}>Choose AI Voice 🎤 </Text>
              <View style={{flex:1, borderRadius:15, backgroundColor:Colors.primary, paddingVertical:5, marginVertical:5, height:'80%',
                alignItems:'center', marginHorizontal:7
              }}>
                <Text style={{fontFamily:'montserrat', fontWeight:'600'}}>{choosenVoice?.name}</Text>
              </View>
              <Ionicons name="chevron-forward" style={{color : Colors.primary}} size={15}/>
            </View>
          </TouchableOpacity>
        </Animated.View>


        {generating ? <View style={{flexDirection:'column', gap:10}}>
          <View style={{backgroundColor:Colors.surface, borderRadius:15, padding:15, alignItems:'center', justifyContent:'center',
            marginHorizontal:15, marginVertical:5, flexDirection:'row', paddingHorizontal:15, gap:15, borderColor:Colors.secondary,
            borderWidth:2}}>
              <Text style={{fontFamily:'montserrat', color:Colors.secondary, fontSize:18, fontWeight:'600'}}>Generating ....</Text>
              <ActivityIndicator color={Colors.secondary}/>
          </View>
        </View>
         :
        <Animated.View style={{transform : [{scale : generateButtonRef}]}}>
          <TouchableOpacity onPress={() => handleGenerate()}>
            <View style={{
              backgroundColor:Colors.secondary, borderRadius:15, padding:15, alignItems:'center', justifyContent:'center',
              marginHorizontal:15, marginVertical:5, flexDirection:'row', paddingHorizontal:15, gap:15}}>
              <Text style={{fontFamily:'montserrat', color:Colors.primary, fontSize:18, fontWeight:'600'}}>Generate</Text>
              <Ionicons name="star" size={18} color={Colors.primary} />
              {/* <Ionicons name="chevron-forward" style={{color : Colors.primary}} size={15}/> */}
            </View>
          </TouchableOpacity>
        </Animated.View> }

        <Animated.View style={{transform : [{scale : generateButtonRef}]}}>
          <TouchableOpacity onPress={() => { router.replace('/login') }}>
            <View style={{backgroundColor:Colors.secondary, borderRadius:15, padding:15, alignItems:'center', justifyContent:'center',
              marginHorizontal:15, marginVertical:5, flexDirection:'row', paddingHorizontal:15, gap:15}}>
              <Text style={{fontFamily:'montserrat', color:Colors.primary, fontSize:18, fontWeight:'600'}}>Generate</Text>
              <Ionicons name="star" size={18} color={Colors.primary} />
              {/* <Ionicons name="chevron-forward" style={{color : Colors.primary}} size={15}/> */}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>


      {/**
       * Use reddit URL Modal here
       */}
      <Modal isVisible={redditVisibility} style={{flex:1}}>
        <View style={{backgroundColor:Colors.surface, borderRadius:15, padding:15, margin:0, height:'auto'}}>
          <ScrollView style={{}}>
            <View style={{flex:1, marginTop:5, gap:10}}>
              <Text style={{fontFamily:'montserrat', fontSize:15, color:Colors.primary}}>
                Paste Reddit URL here ...
              </Text>  
              <TextInput
                style={{borderColor:Colors.primary, borderWidth:1, borderRadius:10, padding:10, marginRight:5, 
                  fontFamily:'montserrat', color:Colors.primary}}
                ref={redditInputRef}
                keyboardType="url"
                onChangeText={onRedditInputChanged}
                placeholder="https:// ..."
              />
              <TouchableOpacity onPress={() =>  (!gettingUrlContent ? handleRedditURL : () => {})()}>
                <View style={{borderRadius:15, padding:10,
                  backgroundColor: gettingUrlContent ? Colors.surface : Colors.secondary}}>
                  { gettingUrlContent ? 
                  <>
                  <View style={{justifyContent:'center', alignItems:'center', flexDirection:'row', gap:5}}>
                    <Text style={{fontFamily:'montserrat', color:Colors.primary, textAlign:'center'}}>
                      Getting the script ...
                    </Text>
                    <ActivityIndicator />
                  </View>
                  </>
                  : 
                  <Text style={{fontFamily:'montserrat', color:Colors.primary, textAlign:'center'}}>
                    Search for script
                  </Text> }
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={{position:'absolute', transform:[{translateX:-8}, {translateY:8}], alignSelf:'flex-end'}}>
            <TouchableOpacity onPress={() => setRedditVisibility(false)}>
              <Ionicons name="close-circle" size={30} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/**
       * Here is the modal that will appear when the user wants to change the voice
       */}
      <Modal isVisible={voiceIdModelVisibility} style={{flex:1}}>
        <View style={{backgroundColor:Colors.surface, borderRadius:15, padding:15, margin:0, height:'35%'}}>
          <ScrollView style={{}}>
            <View style={{flex:1, marginTop:25}}>
              {voices?.map(voicePair => {
                return  <View style={{flexDirection:'row', margin:3, padding:7, justifyContent:'flex-start'}} key={voicePair.id}>
                  <Text style={{fontFamily:'montserrat', color: Colors.primary, fontSize:20, width:'30%'}}>{voicePair.name}</Text>
                  <TouchableOpacity onPress={() => { playVoiceSample(voicePair.name) }} style={{marginRight:0}}>
                    <Ionicons name="play" color={Colors.primary} size={23}/>
                  </TouchableOpacity>
                  <View style={{flex:1}} />
                  <TouchableOpacity onPress={() => { setChoosenVoice(voicePair);setVoiceIdModelVisibility(false) }} style={{paddingLeft:10}}>
                    <Ionicons name={choosenVoice?.id == voicePair.id ? 'checkbox' : 'checkbox-outline'} 
                      color={choosenVoice?.id == voicePair.id ? 'green' : Colors.secondary} size={23}/>
                  </TouchableOpacity>
                </View>
              })}
            </View>
          </ScrollView>
          <View style={{position:'absolute', transform:[{translateX:-8}, {translateY:8}], alignSelf:'flex-end'}}>
            <TouchableOpacity onPress={() => setVoiceIdModelVisibility(false)}>
              <Ionicons name="close-circle" size={30} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/** 
       * Here is the modal sheet that will appear when the user hits the tokens button
       */}

      <Modal isVisible={tokensModalVisibile} style={{flex:1}}>
        <View style={{backgroundColor : Colors.surface, borderRadius:15, padding:15, margin:0, height:'50%'}}>
          <View style={{position:'absolute', transform:[{translateX:-8}, {translateY:8}], alignSelf:'flex-end'}}>
            <TouchableOpacity onPress={() => setTokensModalVisibility(false)}>
              <Ionicons name="close-circle" size={30} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{flex:1, justifyContent:'space-around', alignItems:'center'}}>
            <View style={{alignItems:'center', flexDirection:'row', gap:10}}>
              <Text style={{fontFamily:'montserrat', fontSize:20, color: Colors.primary, textAlign:'center', fontWeight:'800'}}>
                You have <Text style={{color:Colors.tokens}}>{userProfile.tokens?.toFixed(0)}</Text> Tokens Left!
              </Text>
            </View>
            <View style={{flexWrap:'wrap', flexDirection:'row', gap:5}}>
              <Text style={{fontFamily:'montserrat', fontSize:15, color: Colors.primaryShade, textAlign:'center', fontWeight:'600'}}>
                You can either buy tokens, or watch ad to get <Text style={{color: Colors.tokens}}>{tokensPerAd}</Text> tokens
              </Text>
            </View>
          </View>
          <Animated.View style={{transform : [{scale:modalTokensRef}]}}>
            <TouchableOpacity onPress={() => handleBuyTokens()}>
              <View style={[Theme.button]}>
                <Text style={{fontFamily:'montserrat', color:Colors.surface, fontSize:15, fontWeight:'800'}}>Buy Tokens now!</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{transform : [{scale:modalTokensRef}]}}>
            <TouchableOpacity onPress={() => handleWatchAd()}>
              <View style={[Theme.button, {marginTop:0}]}>
                <Text style={{fontFamily:'montserrat', color:Colors.surface, fontSize:15, fontWeight:'800'}}>Watch Ad to get <Text style={{color: Colors.secondary}}>{tokensPerAd}</Text> tokens!</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  </>
}