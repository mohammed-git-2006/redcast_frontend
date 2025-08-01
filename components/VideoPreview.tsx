import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

interface Props
{
  url : string,
  token : string,
  width : number,
  orderId : string
}

export default function VideoPreview({orderId, url, token, width} : Props) {
  const videoRef = useRef<Video>(null)
  const vidWidth = useRef(width).current;
  const vidHeight = useRef(vidWidth * 1.42).current
  const [iconName, setIconName] = useState<"play"|"pause">("play")
  const [downloading, setDownloading] = useState(false);
  
  const handleDownload = async () => {
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
    videoRef.current?.setOnPlaybackStatusUpdate((status) => {
      console.log(status.isLoaded + ', ' + status.androidImplementation)
    })
  }, [])

  const handlePlayPause = () => {
    if (iconName == 'pause') {
      videoRef.current?.pauseAsync();
      setIconName('play')
    } else {
      videoRef.current?.playAsync();
      setIconName('pause')
    }
  }

  const handleRepeat = () => {
    videoRef.current?.pauseAsync()
    videoRef.current?.replayAsync();
    setIconName('pause')
  }

  return <View style={{alignItems:'center', marginVertical:15}}>
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
      style={{ height: vidHeight, width: vidWidth }}
      onError={(e) => console.log(`Video ${orderId} error`, e)}
      onLoad={() => console.log(`Video ${orderId} loaded`)}
    />
    <View style={{position:'absolute', transform:[{translateY:vidHeight - 50}]}}>
      <View style={{height:50, backgroundColor:'black', opacity:0.5, width:vidWidth * .8, padding : 0, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:10}}>
        <TouchableOpacity style={{padding:10}} onPress={() => { handleRepeat() }}>
          <Ionicons name={'repeat-outline'} color={'white'} size={25}/>
        </TouchableOpacity>
        <TouchableOpacity style={{padding:10}} onPress={() => {handlePlayPause()}}>
          <Ionicons name={iconName} color={'white'} size={25}/>
        </TouchableOpacity>
        {downloading ? <>
          <ActivityIndicator />
        </>: <TouchableOpacity style={{padding:10}} onPress={() => {handleDownload()}}>
          <Ionicons name={'download-outline'} color={'white'} size={25} />
        </TouchableOpacity>}
      </View>
    </View>
  </View>
}