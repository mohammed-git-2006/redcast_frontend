import { BuyTokensComponent } from "@/components/BuyTokens";
import GenVideoComponent from "@/components/GeneratingVideoComponent";
import LoadingComponent from "@/components/LoadingComponent";
import NoInternetView from "@/components/NoInternet";
import { Colors, Theme } from "@/constants/Colors";
import { db } from "@/constants/firebase";
import { loadUserFromServer, SERVER_URL, UserProfile } from "@/constants/UserProfile";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { Audio } from 'expo-av';
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { onValue, ref } from "firebase/database";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    backgroundColor : Colors.primary,
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
    fontFamily : 'montserrat',
    fontWeight:600,
    textAlign:'right',
    fontSize: 14,
    color: 'black'
  },
})


interface VoicePair
{
  id : string,
  name : string,
}



interface ServerValues
{
  voices : VoicePair[],
  bgMusic : string[],
  vidClips : {name : string, id : string}[],
  tokens_per_ad : number,
  tokens_per_100 : number,
  max_chars : number,
  tokens_per_sg : number
}

interface GenerationRequest
{
  script : string,
  title : string,
  voiceId : string,
  bgMusic : string,
  bgClip : string,
}

interface GenerationResponse
{
  status: boolean,
  msg : string,
  orderId : string,
}


interface ButtonProps
{
  icon? : typeof Ionicons,
  text : string,
  chevron? : any,
  onPress : () => void,
  animationRef? : Animated.Value
}

export const HomeButton = ({icon, text, chevron, onPress, animationRef} : ButtonProps) => {
  const inner = <TouchableOpacity onPress={() => onPress()}>
    <View style={{flexDirection:'row', backgroundColor:Colors.onSurface, marginHorizontal:15, padding : 10,
        marginVertical:7, borderRadius:7, alignItems:'center', gap:10}}>
      { icon != null ? <>
        <Ionicons name={icon} size={25} color={Colors.secondary} />
      </> : <></> }
      <Text style={{fontFamily:'montserrat', fontWeight:'700', color:Colors.primary}}>{text}</Text>
      {!chevron ? <>
        <View style={{flex:1}}/>
        <Ionicons name="chevron-forward" color={Colors.primary} size={14} />
      </> : <></>}
    </View>
  </TouchableOpacity>;

  return animationRef == null ? inner 
  : <Animated.View style={{transform : [{scale : animationRef}]}}>
    {inner}
  </Animated.View>
}

interface ChoicesOptionsProps
{
  text: string,
  currentOption : string,
  onPress : () => void,
  animationRef? : Animated.Value,
  icon? : typeof Ionicons
}

const ChoicesButton = ({text, currentOption, onPress, animationRef, icon} : ChoicesOptionsProps) => {
  return <TouchableOpacity onPress={() => onPress()}>
    <View style={{flexDirection:'row', backgroundColor:Colors.onSurface, marginHorizontal:15, padding : 10,
        marginVertical:7, borderRadius:7, alignItems:'center', gap:10}}>
      { icon != null ? <>
        <Ionicons name={icon} size={25} color={Colors.secondary} />
      </> : <></> }
      <Text style={{fontFamily:'montserrat', fontWeight:'700', color:Colors.primary}}>{text}</Text>
      <View style={{flex:1}}/>
      <Text style={{fontFamily:'montserrat', fontWeight:'700', textDecorationLine: 'underline', textDecorationStyle: 'solid', textDecorationColor: Colors.primary,
          color:Colors.primary}}>
        {currentOption}
      </Text>
      <Ionicons name="chevron-forward" color={Colors.primary} size={14} />
    </View>
  </TouchableOpacity>;
}

export default function Home() {
  const [fontsLoaded] = useFonts({
    'montserrat' : require("../../assets/fonts/montserrat.ttf"),
  });

  /**
   * Define states and references // REF-AREA
   */
  const [loading, setLoading] = useState(true);
  const [connectionErr, setConnectionErr] = useState(false);
  const [tokensModalVisibile, setTokensModalVisibility] = useState(false);
  const [voiceIdModelVisibility, setVoiceIdModelVisibility] = useState(false); 
  const [bgMusicModalVisibility, setBgMusicModalVisibility] = useState(false); 
  const [vidClipsModalVisibility, setVidClipsModalVisibility] = useState(false); 
  const [redditVisibility, setRedditVisibility] = useState(false); 
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [maxCharacters, setMaxCharacters] = useState(1500);
  const [userScript, setUserScript] = useState("");
  const [calculatedLength, setCalculatedLength] = useState(0);
  const [tokensPerAd, setTokensPerAd] = useState(30);
  const [choosenVoice, setChoosenVoice] = useState<VoicePair|null>(null);
  const [voices, setVoices] = useState<VoicePair[]>();
  const [serverValues, setServerValues] = useState<ServerValues>()
  const [bgMusic, setBgMusic] = useState<string>("Hope")
  const [vidClip, setVidClip] = useState<{name:string, id:string}>({name:"Minecraft 1", id:"mc_1"})
  const [tokensPer100, setTokensPer100] = useState<number|null>()
  const [tokensPerScriptGen, setTokensPerScriptGen] = useState<number|null>()
  const [redditUrl, setRedditUrl] = useState("")
  const [gettingUrlContent, setGettingUrlContent] = useState(false);
  const [jwtToken, setJwtToken] = useState<string|null>(null)
  const pagerRef = useRef<PagerView>(null);
  const [generating, setGenerating] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string|null>(null)
  const [previewVideUrl, setPreviewVideoUrl] = useState<string|null>(null);
  const currentPage = useRef(0);
  const scriptInputRef = useRef<TextInput>(null)
  const scriptTitleInputRef = useRef<TextInput>(null)
  const isFocuse = useIsFocused();
  const [scriptTitle, setScriptTitle] = useState("");

  useEffect(() => {
    updateTokensAsync()
  }, [isFocuse])
  
  /**
   * Define animations references
   */
  const modalTokensRef = useRef(new Animated.Value(0)).current;
  const redditButtonRef = useRef(new Animated.Value(.0)).current;
  const genScriptRef = useRef(new Animated.Value(.0)).current;
  const prevGensRef = useRef(new Animated.Value(.0)).current;
  const generateButtonRef = useRef(new Animated.Value(.0)).current;

  const congratsRef = useRef<LottieView>(null)


  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(redditButtonRef, {
        useNativeDriver : true,
        toValue : 1.0,
        duration : 250,
        easing : Easing.out(Easing.ease),
      }),

      Animated.timing(genScriptRef, {
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

      Animated.timing(generateButtonRef, {
        useNativeDriver : true,
        toValue : 1.0,
        duration : 250,
        delay : 0,
        easing : Easing.out(Easing.ease),
      }),
    ]).start();

    AsyncStorage.getItem('user', (e, item) => {
      console.log(`User : ${item}`)
    })
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
      setServerValues(parsedResult)
      setBgMusic(parsedResult.bgMusic[0]!)
      setVoices(parsedResult.voices)
      setChoosenVoice(parsedResult.voices[0])
      setTokensPerAd(parsedResult.tokens_per_ad)
      setMaxCharacters(parsedResult.max_chars)
      setTokensPer100(parsedResult.tokens_per_100)
      setTokensPerScriptGen(parsedResult.tokens_per_sg)
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
        // alert(luR)
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
      setCalculatedLength(userScript.length / 10)
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

  const [audioSample, setAudioSample] = useState<Audio.Sound|null>()

  const playBgMusicSample = async (name:string) => {
    if (audioSample != null) {
      audioSample.stopAsync()
    }

    const {sound} = await Audio.Sound.createAsync(
      {uri:`${SERVER_URL}/bg-music/${name}/sample`},
      {shouldPlay:true}
    )

    setAudioSample(sound)
  }

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

  useEffect(() => {
    audioSample?.stopAsync()
  }, [bgMusicModalVisibility, vidClipsModalVisibility])

  const redditInputRef = useRef<TextInput>(null);

  const onRedditInputChanged = (newVal : string) => {
    setRedditUrl(newVal)
  }

  const updateTokensAsync = async () => {
    // setUpdatingTokens(true);

    try {
      const response = await fetch(`${SERVER_URL}/user/tokens`, {
        headers : {
          'Authorization' : `Bearer ${jwtToken}`,
        }
      })

      const jsonResponse = await response.json();
      setUserProfile({...userProfile, tokens : jsonResponse.tokens})
    } catch(err) {
      setConnectionErr(true);
    }
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
      scriptInputRef?.current?.focus()
      return;
    }

    if (scriptTitle.trim().length == 0) {
      scriptTitleInputRef?.current?.focus()
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
        title : scriptTitle,
        voiceId : choosenVoice?.name,
        bgMusic : bgMusic,
        bgClip: vidClip.id
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
    if (!generating && previewVideUrl) {
      congratsRef.current?.play();
    }
  }, [generating])

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

  const { width, height} = Dimensions.get('window')

  return loading ? <>
    <View style={{justifyContent : 'center', alignItems : 'center', flex:1}}>
      {/* <ActivityIndicator size={500} color={Colors.secondary} style={{width:150, height:150}}>
      </ActivityIndicator> */}
      <LoadingComponent />
    </View>
  </> : connectionErr ? <>
    <NoInternetView refreshCallback={() => { setConnectionErr(false); setLoading(true); loadPage() }}/>
  </> : <>
    <View style={[Theme.body]}>
      <View style={{backgroundColor : Colors.onSurface, padding : 15, paddingTop:20, justifyContent:'center', alignItems:'center'}}>
        <SafeAreaView style={{flexDirection:'row', gap:5, justifyContent:'space-between', alignItems:'center', width:'100%'}}>
          <Text style={[styles.headerText, {fontSize:15, marginTop:0, fontWeight:'800'}]}>👋  {userProfile.name}</Text>
          <TouchableOpacity onPress={() => viewTokens()}>
            <View style={{flexDirection:'row', gap:5, justifyContent:'center', alignItems:'center',
              padding:5,borderColor:Colors.primary, borderWidth:2, borderRadius:15, marginTop:0
            }}>
              {/* <Image source={require('../../assets/images/token.png')} 
                style={{width:15, height:15, tintColor:'white', resizeMode:'contain'}}/> */}
              <Ionicons name="wallet" color={Colors.tokens} size={15} />
              <Text style={[styles.headerText, {fontWeight:'800', color:Colors.tokens}]}>{userProfile.tokens?.toFixed(1)}</Text>
              {/* <Text style={{fontFamily:'montserrat', color:Colors.primary, fontWeight:'600'}}>Tokens</Text> */}
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
      <ScrollView style={{flex:1, paddingTop:10}}>
        <View style={{flexDirection:'row', marginHorizontal:15, marginBottom:10, justifyContent:'space-between'}}>
          <Text style={{color: Colors.primary, fontFamily:'montserrat', fontWeight:'500'}}>
            <Text style={{color: Colors.tokens, fontWeight:'700'}}>{((userProfile.tokens??0) * (tokensPer100 ?? 0)).toFixed(1)}</Text> characters left
          </Text>
          <TouchableOpacity style={{flexDirection:'row', gap:3, alignItems:'center'}} onPress={() => {setUserScript(''); setScriptTitle('');}}>
            <Text style={{fontFamily:'montserrat', color:Colors.primary}}>Clear</Text>
            <Ionicons name="clipboard" style={{color:Colors.primary, transform : [{translateY:1}]}} />
          </TouchableOpacity>
        </View>

        <TextInput maxLength={maxCharacters} style={[Theme.input, {height:50}]} cursorColor={Colors.primary}  
          multiline={false} placeholder="Title here ..." selectionColor={Colors.primary}
          onChangeText={(newTex) => setScriptTitle(newTex)} value={scriptTitle} ref={scriptTitleInputRef}
          />

        <TextInput maxLength={maxCharacters} style={[Theme.input]} cursorColor={Colors.primary}  
          multiline={true} placeholder="Paste your script here ..." selectionColor={Colors.primary}
          onChangeText={(newTex) => handleInputChange(newTex)} value={userScript} ref={scriptInputRef}
          />

        <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:0, marginBottom:3}}>
          <Text style={{color: calculatedLength >= maxCharacters ? 'red' : 'white', fontFamily:'montserrat', marginHorizontal:15, fontWeight:'600'}}>
            {userScript.length}/{maxCharacters}
          </Text>
          <Text style={{color: (calculatedLength / (tokensPer100??1)) > (userProfile.tokens ?? 0) ? 'red' : Colors.tokens, fontFamily:'montserrat', marginHorizontal:15, fontWeight:'600'}}>
            {(userScript.length / (tokensPer100??1)).toFixed(2)} Tokens
          </Text>
        </View>

        {previewVideUrl != null ? <>
        <HomeButton text="View result" onPress={() => router.navigate( {
            pathname : '/home/view_video',
            params : {
              orderId : currentOrderId,
              jwtToken : jwtToken
            }
          })  } icon="play-circle" />
        </> : generating ? <>
            <GenVideoComponent isVideo={true} />
        </> : <></>}

        <ChoicesButton onPress={() => setVoiceIdModelVisibility(true)} currentOption={choosenVoice?.name ?? ""} text="Choose Voice" icon="mic" />
        <ChoicesButton onPress={() => setBgMusicModalVisibility(true)} currentOption={bgMusic} text="Background Music" icon="musical-note" />
        <ChoicesButton onPress={() => setVidClipsModalVisibility(true)} currentOption={vidClip.name} text="Background Video" icon="film" />
        <HomeButton text="Use reddit URL"   icon="logo-reddit" onPress={() => {setRedditVisibility(true)}} animationRef={redditButtonRef} />
        {/* <HomeButton text="Choose Background Music"   icon="musical-note" onPress={() => {setRedditVisibility(true)}} animationRef={redditButtonRef} /> */}
        <HomeButton text="Generate script"  icon="sparkles" onPress={() => { router.navigate(
          { pathname :'/home/generate_script', params : {
            jwtToken : jwtToken,
            name : userProfile?.name,
            tokens : userProfile?.tokens,
            email : userProfile?.email,
            tokensPerSg : tokensPerScriptGen,
            tokensPerAd : tokensPerAd
          } }
        );  }} animationRef={genScriptRef} />
        <HomeButton text="Previous generations" icon="videocam" onPress={() => { router.navigate({pathname:'/home/previous_generations', params:{
            username : userProfile.name,
            jwtToken : jwtToken,
            allGens : userProfile.gens
          }}) }} animationRef={prevGensRef} />

        
        {generating ? <View style={{flexDirection:'column', gap:10}}>
          <View style={{backgroundColor:Colors.surface, borderRadius:15, padding:15, alignItems:'center', justifyContent:'center',
            marginHorizontal:15, marginVertical:5, flexDirection:'row', paddingHorizontal:15, gap:15, borderColor:Colors.secondary,
            borderWidth:2}}>
              <Text style={{fontFamily:'montserrat', color:Colors.secondary, fontSize:18, fontWeight:'600'}}>Generating ....</Text>
              <LoadingComponent small={true}/>
          </View>
        </View>
         :
        <Animated.View style={{transform : [{scale : generateButtonRef}]}}>
          <TouchableOpacity onPress={() => handleGenerate()}>
            <View style={{
              backgroundColor:Colors.secondary, height:45, borderRadius:7, padding:10, alignItems:'center', justifyContent:'center',
              marginHorizontal:15, marginVertical:5, flexDirection:'row', paddingHorizontal:15, gap:15}}>
              <Text style={{fontFamily:'montserrat', color:Colors.primary, fontSize:15, fontWeight:'600'}}>Generate</Text>
              <Ionicons name="star" size={18} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </Animated.View> }

        <HomeButton text="Signout" icon="exit" onPress={() => { router.replace('/login') }} />
        <HomeButton text="Signout" icon="exit" onPress={() => { congratsRef.current?.play() }} />
        <SafeAreaView/>
      </ScrollView>


      {/**
       * Use reddit URL Modal here
       */}
      <Modal isVisible={redditVisibility} style={{flex:1}}>
        <View style={{backgroundColor:Colors.surface, borderRadius:15, padding:15, margin:0, height:'auto'}}>
          <ScrollView style={{}}>
            <View style={{flex:1, marginTop:5, gap:10}}>
              <Text style={{fontFamily:'montserrat', fontSize:15, color:Colors.primary, fontWeight:'700'}}>
                Paste Reddit link here ...
              </Text>  
              <Text style={{fontFamily:'montserrat', color:Colors.primaryShade, fontWeight:'700'}}>
                * it's recommended to copy the text from reddit, rather than using the link
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
                    <Text style={{fontFamily:'montserrat', color:Colors.primary, textAlign:'center', fontWeight:'800'}}>
                      Getting the script ...
                    </Text>
                    {/* <ActivityIndicator /> */}
                    <LoadingComponent/>
                  </View>
                  </>
                  : 
                  <Text style={{fontFamily:'montserrat', color:Colors.primary, textAlign:'center', fontWeight:'800'}}>
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

      {/*
       * Here is the modal that will appear when the user wants to change the voice
       */}
      <Modal isVisible={voiceIdModelVisibility} style={{flex:1}}>
        <View style={{backgroundColor:Colors.surface, borderRadius:15, padding:15, margin:0, height:'35%'}}>
          <ScrollView style={{}}>
            <View style={{flex:1, marginTop:25}}>
              {voices?.map(voicePair => {
                return <View style={{flexDirection:'row', margin:3, padding:7, justifyContent:'flex-start'}} key={voicePair.id}>
                  <Text style={{fontFamily:'montserrat', color: Colors.primary, width:'20%'}}>{voicePair.name}</Text>
                  <View style={{flex:1}} />
                  <TouchableOpacity onPress={() => { playVoiceSample(voicePair.name) }} style={{marginRight:10}}>
                    <Ionicons name="play" color={Colors.primary} size={20}/>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setChoosenVoice(voicePair); setVoiceIdModelVisibility(false); }} style={{paddingLeft:10}}>
                    <Ionicons name={choosenVoice?.id == voicePair.id ? 'checkbox' : 'checkbox-outline'} 
                      color={choosenVoice?.id == voicePair.id ? 'green' : Colors.secondary} size={23}/>
                  </TouchableOpacity>
                </View>
              })}
            </View>
          </ScrollView>
          <View style={{position:'absolute', transform:[ {translateX:-8}, {translateY:8} ], alignSelf:'flex-end'}}>
            <TouchableOpacity onPress={() => setVoiceIdModelVisibility(false)}>
              <Ionicons name="close-circle" size={30} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/**
       * Background Music options modal
       */}
      <Modal isVisible={bgMusicModalVisibility} style={{flex:1}}>
        <View style={{backgroundColor:Colors.surface, borderRadius:15, padding:15, margin:0, height:'35%'}}>
          <ScrollView style={{}}>
            <View style={{flex:1, marginTop:25}}>
              {serverValues?.bgMusic?.map((name, index) => {
                return  <View style={{flexDirection:'row', margin:3, padding:7, justifyContent:'flex-start'}} key={index}>
                  <Text style={{fontFamily:'montserrat', color: Colors.primary}}>{name}</Text>
                  <View style={{flex:1}} />
                  <TouchableOpacity onPress={() => { playBgMusicSample(name) }} style={{marginRight:10}}>
                    <Ionicons name="play" color={Colors.primary} size={20}/>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setBgMusic(name);setBgMusicModalVisibility(false) }} style={{paddingLeft:10}}>
                    <Ionicons name={bgMusic! == name ? 'checkbox' : 'checkbox-outline'} 
                      color={bgMusic == name ? 'green' : Colors.secondary} size={23}/>
                  </TouchableOpacity>
                </View>
              })}
            </View>
          </ScrollView>
          <View style={{position:'absolute', transform:[{translateX:-8}, {translateY:8}], alignSelf:'flex-end'}}>
            <TouchableOpacity onPress={() => setBgMusicModalVisibility(false)}>
              <Ionicons name="close-circle" size={30} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/**
       * Background Video Clip options modal
       */}
      <Modal isVisible={vidClipsModalVisibility} style={{flex:1}}>
        <View style={{backgroundColor:Colors.surface, borderRadius:15, padding:15, margin:0, height:'35%'}}>
          <ScrollView style={{}}>
            <View style={{flex:1, marginTop:25}}>
              {serverValues?.vidClips?.map((pair, index) => {
                return  <View style={{flexDirection:'row', margin:3, padding:7, justifyContent:'flex-start'}} key={index}>
                  <Text style={{fontFamily:'montserrat', color: Colors.primary}}>{pair.name}</Text>
                  <View style={{flex:1}} />
                  <TouchableOpacity onPress={() => { }} style={{marginRight:10, flexDirection:'row', gap:5}}>
                    <Ionicons name="image-outline" color={Colors.primary} size={20}/>
                    <Ionicons name="play" color={Colors.primary} size={20}/>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setVidClip(pair);setVidClipsModalVisibility(false) }} style={{paddingLeft:10}}>
                    <Ionicons name={vidClip.name! == pair.name ? 'checkbox' : 'checkbox-outline'} 
                      color={vidClip.name == pair.name ? 'green' : Colors.secondary} size={23}/>
                  </TouchableOpacity>
                </View>
              })}
            </View>
          </ScrollView>
          <View style={{position:'absolute', transform:[{translateX:-8}, {translateY:8}], alignSelf:'flex-end'}}>
            <TouchableOpacity onPress={() => setVidClipsModalVisibility(false)}>
              <Ionicons name="close-circle" size={30} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 
        * Ignore pointer events for the overlay view and its children 
        */}
      <View
        style={{ width: width, height: height, position: 'absolute', bottom: 0, pointerEvents: 'none' }}
        pointerEvents="none">
        <LottieView
          source={require('../../assets/lottie/congrats.json')}
          ref={congratsRef}
          autoPlay={false}
          loop={false}
          style={{ width: width, height: height, pointerEvents: 'none'  }} />
      </View>

      <BuyTokensComponent onClosed={() => { setTokensModalVisibility(false) }} visible={tokensModalVisibile} tokens={userProfile.tokens??0}
        tokensPerAd={tokensPerAd} onBuyPageOpened={() => { setTokensModalVisibility(false) }} />
   </View>
  </>
}