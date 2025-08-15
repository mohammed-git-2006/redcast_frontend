import { Colors } from "@/constants/Colors";
import { SERVER_URL } from "@/constants/UserProfile";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from 'expo-file-system';
import { router } from "expo-router";
import { shareAsync } from 'expo-sharing';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingComponent from "./LoadingComponent";

interface Props
{
  token : string,
  orderId : string
}

const vidRatio = 1920 / 1080

export default function VideoPreview({orderId,  token} : Props) {
  const videoRef = useRef<Video>(null)
  // const vidHeight = useRef(vidWidth * vidRatio).current
  const [iconName, setIconName] = useState<"play"|"pause">("play")
  const [downloading, setDownloading] = useState(false);
  const url = useRef(`${SERVER_URL}/order/${orderId}/result`).current;
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window')
  const [vidLoaded, setVideoLoaded] = useState(false);
  const [loadingErr, setLoadingErr] = useState(false);
  const profilePicRef = useRef(new Animated.Value(0)).current;

  const handleDownload = async () => {
    if (!vidLoaded) return;
    try {
      setDownloading(true);
      const localUri = FileSystem.documentDirectory + `RedCast ${orderId.substring(0, 5)}.mp4`;
      const downloadResumable = FileSystem.createDownloadResumable(
        url, localUri, {
          headers : { Authorization : `Bearer ${token}` }
        }
      );

      const result = await downloadResumable.downloadAsync();
      const shareResult = shareAsync(result!.uri);
      setDownloading(false);
    } catch (err) {
      alert(`Failed to download the file ${err}`)
      setDownloading(false);
    }
  }

  useEffect(() => {
    Animated.loop(
      Animated.spring(
      profilePicRef,
      {
        toValue: -30,
        friction: 2,
        tension: 120,
        useNativeDriver: true,
      }
      )
    ).start();
  }, [])

  const handlePlayPause = () => {
    if (!vidLoaded) return;

    if (iconName == 'pause') {
      videoRef.current?.pauseAsync();
      setIconName('play')
    } else {
      videoRef.current?.playAsync();
      setIconName('pause')
    }
  }

  const handleRepeat = () => {
    if (!vidLoaded) return;
    videoRef.current?.pauseAsync()
    videoRef.current?.replayAsync();
    setIconName('pause')
  }

  const videoComponentHeight = useRef(height-insets.top-insets.bottom-50).current;

  return <View style={{alignItems:'center', marginVertical:0}}>
    <Video
      source={{
        uri: url,
        headers: { Authorization: `Bearer ${token}` }
      }}
      ref={videoRef}
      isMuted={false}
      volume={1.0}
      resizeMode={ResizeMode.CONTAIN}
      onLoadStart={() => alert('Started loading vid ...')}
      style={{ width: width, height:videoComponentHeight, marginTop:insets.top}}
      onError ={() => {setLoadingErr(true); setVideoLoaded(true)}}
      onLoad  ={() => {setLoadingErr(false); setVideoLoaded(true)}}
    /> 
    
      <View style={{position:'absolute', width: width, height:videoComponentHeight, marginTop:insets.top, alignItems:'center', justifyContent:'center'}}>
        {loadingErr ? <> 
          <Text style={{fontFamily:'montserrat', fontWeight:'800', color:Colors.primary}}>
            Failed to load media
          </Text>
        </> : vidLoaded ? <View></View> : <>
          <Animated.View style={{transform: [ {translateY:profilePicRef} ]}}>
            <Image source={require('@/assets/images/profile.png')} style={{width:150, height:150, marginBottom:15}}/>
          </Animated.View>
          <LoadingComponent />
        </>}
      </View>
    
      <View style={{backgroundColor:'black', opacity:0.5, width:width, padding : 0, 
        paddingBottom:insets.bottom, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:10}}>

        <TouchableOpacity style={{padding:10}} onPress={() => { handleRepeat() }}>
          <Ionicons name={'repeat-outline'} color={'white'} size={35}/>
        </TouchableOpacity>
        <TouchableOpacity style={{padding:10}} onPress={() => {handlePlayPause()}}>
          <Ionicons name={iconName} color={'white'} size={35}/>
        </TouchableOpacity>
        {downloading ? <>
          <ActivityIndicator />
        </>: <TouchableOpacity style={{padding:10}} onPress={() => {handleDownload()}}>
          <Ionicons name={'download-outline'} color={'white'} size={35} />
        </TouchableOpacity>}
        <TouchableOpacity style={{padding:10}} onPress={() => { router.back() }}>
          <Ionicons name={'close'} color={'white'} size={35}/>
        </TouchableOpacity>
      </View>
    
  </View>
}