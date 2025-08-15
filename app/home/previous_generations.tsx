import LoadingComponent from "@/components/LoadingComponent";
import { Colors } from "@/constants/Colors";
import { SERVER_URL } from "@/constants/UserProfile";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import { shareAsync } from "expo-sharing";
import { useEffect, useState } from "react";
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GeneratedItem {
  orderId : string,
  url : string,
}

interface WindowParams {
  jwtToken : string,
  username : string,
}



interface PreviewComponentProps 
{
  orderId: string,
  token : string,
}

function VideoPreviewComponent ( {orderId, token} : PreviewComponentProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const localUri = FileSystem.documentDirectory + `RedCast ${orderId.substring(0, 5)}.mp4`;
      const downloadResumable = FileSystem.createDownloadResumable(
        `${SERVER_URL}/order/${orderId}/result`, localUri, {
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



  return <View style={{flex:1}}>
    <TouchableOpacity onPress={() => { handleDownload() }} style={{flex:1}}>
      <Image source={{uri : `${SERVER_URL}/order/${orderId}/thumbnail`}} style={{flex:1, width:'100%'}} onLoadEnd={() => { setImageLoaded(true); setLoading(false) }}
        onError={() => { setLoading(false); setImageLoaded(false); }} />
      { imageLoaded ? <></> : <>
        <View style={{position:'absolute', justifyContent:'center', alignItems:'center', flex:1, right:0, left:0, top:0, bottom:0, borderRadius:0,
            borderColor:Colors.secondary, borderWidth:2
        }}>
          <LoadingComponent small={true} />
        </View>
      </>}
      <View style={{position:'absolute', left:0, right:0, top:0, bottom:0, justifyContent:'center', alignItems:'center'}}>
        {
          downloading || loading ? <>
            <LoadingComponent />
          </> : (
            imageLoaded ? <>
              
            </> : <></>  
          )
        }

        {!imageLoaded ? (
          downloading ? <>
            <LoadingComponent />
          </> : <>
            {loading ? <></> : <View style={{justifyContent:'center', alignItems:'center', gap:15}}>
              <Ionicons name="cloud-offline-outline" size={32} color={Colors.primary} />
              <Text style={{color: Colors.primary, fontFamily: 'montserrat', fontSize: 12, textAlign: 'center', fontWeight:'800'}}>Image not loaded</Text>
            </View>}
          </>
        ) : <Ionicons name="download" color={Colors.primary} size={25} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.75,
          shadowRadius: 4,
          elevation: 5,
        }} />}
      </View>
    </TouchableOpacity>
  </View>
}



export default function PreviousGens() {
  const [loading, setLoading] = useState(true);
  const { username, jwtToken, allGens } = useLocalSearchParams();
  const [data, setData] = useState<string[]>();
  const height = Dimensions.get('window').height
  const width = Dimensions.get('window').width
  const padding = useSafeAreaInsets()

  const [loaded] = useFonts({
    'montserrat' : require('../../assets/fonts/montserrat.ttf')
  })

  useEffect(() => {
    // loadItems();
    // setTimeout(() => {
    //   // setData([
    //   //   // {orderId : '0', url : `${SERVER_URL}/order/story0/result`},
    //   //   {orderId : 'story1', url : `${SERVER_URL}/order/story1/result`},
    //   //   {orderId : 'story2', url : `${SERVER_URL}/order/story2/result`},
    //   //   {orderId : 'story3', url : `${SERVER_URL}/order/story3/result`},
    //   //   {orderId : 'story4', url : `${SERVER_URL}/order/story4/result`},
    //   //   {orderId : 'story5', url : `${SERVER_URL}/order/story5/result`},
    //   //   // {orderId : '6', url : `${SERVER_URL}/order/story6/result`},
    //   //   // {orderId : '7', url : `${SERVER_URL}/order/story7/result`},
    //   // ])
    //   setLoading(false);

    // }, 1500);
    
    setLoading(true);
    loadItems();
  }, [loaded])

  const loadItems = () => {
    fetch(`${SERVER_URL}/user/all_orders`, {
      method : 'GET',
      headers : {
        'Authorization' : `Bearer ${jwtToken}`
      }
    }).then(async r => {
      try {
        // console.log(await r.text())
        const jsonResponse:string[] = await r.json()
        setData(jsonResponse)
        setLoading(false)

        // if (jsonResponse.status) {
        //   setData(jsonResponse.data)
        //   setLoading(false);
        // } else {
        //   alert('Unknown error happend')
        //   setLoading(false)
        // }
      } catch(err) {
        alert('Unknown error happend root '.concat(`${err}`))
        setLoading(false)
      } 
    }).catch(e => {
      alert(e)
    })
  }

  return <>
    <View style={{flex:1}}>
      <View style={{flex:1}}>
        <View style={{alignItems:'center', padding:0, backgroundColor:Colors.secondary, paddingTop:padding.top, paddingBottom:15}}>
          <Text style={{fontSize:18, fontFamily:'montserrat', fontWeight:'800', color:Colors.primary}}>RedCast AI </Text>
        </View>
        <View style={{margin:0, borderRadius:0, gap:5, backgroundColor:Colors.onSurface, padding:20, flexDirection:'row'}}>
          <View>
            <Image source={require('@/assets/images/profile.png')} style={{width:50, height:50}} />
          </View>
          <View style={{flex:1, justifyContent:'center'}}>
            <Text style={{fontFamily:'montserrat', fontWeight:'800', fontSize:15, color:Colors.primary}}>{username}</Text>
            <Text style={{fontFamily:'montserrat', fontWeight:'800', fontSize:15, color:Colors.primary}}>Generations : {allGens}</Text>
          </View>
        </View>
        <Text style={{fontFamily:'montserrat', color:Colors.primary, fontWeight:'800', margin:10}}>
          * Videos are deleted from the server automatically after 7 days of generation
        </Text>
        {loading ? <>
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <LoadingComponent />
          </View>
        </> : <>
          <ScrollView>
            <View style={{flexWrap:'wrap', width:width, flex:1, flexDirection:'row'}}>
              { data?.map(item => {
                return <View key={item} style={{width:width/3, height:(width / 3) * 1.8, padding:0, margin:0}}>
                  {/* <View style={{flex:1, backgroundColor:'red'}}> <Text>hello</Text> </View> */}
                  <VideoPreviewComponent orderId={item} token={jwtToken as string} />
                </View>
              }) }
            </View>
          </ScrollView>
        </>}
      </View>
    </View>
  </>
}