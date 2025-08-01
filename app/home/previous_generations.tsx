import VideoPreview from "@/components/VideoPreview";
import { Colors } from "@/constants/Colors";
import { SERVER_URL } from "@/constants/UserProfile";
import { useFonts } from "expo-font";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GeneratedItem {
  orderId : string,
  url : string,
}

interface WindowParams {
  jwtToken : string,
  username : string,
}

export default function PreviousGens() {
  const [loading, setLoading] = useState(true);
  const { username, jwtToken } = useLocalSearchParams();
  const [data, setData] = useState<GeneratedItem[]>();
  const height = Dimensions.get('window').height
  const width = Dimensions.get('window').width
  const padding = useSafeAreaInsets()

  const [loaded] = useFonts({
    'SpaceMono-Bold' : require('../../assets/fonts/montserrat.ttf')
  })

  useEffect(() => {
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
        const jsonResponse:{status:boolean, data: GeneratedItem[]} = await r.json()
        if (jsonResponse.status) {
          setData(jsonResponse.data)
          setLoading(false);
        } else {
          alert('Unknown error happend')
          setLoading(false)
        }
      } catch(err) {
        alert('Unknown error happend')
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
          <Text style={{fontSize:25, fontFamily:'SpaceMono-Bold', color:Colors.primary}}>{username}</Text>
        </View>

        {/* <VideoPreview
          orderId="6197832a865649030067d6bb0a1da8ef787a98b9c3436fb534e11317ee32cf08"
          token={`${jwtToken}`}
          url={`${SERVER_URL}/order/6197832a865649030067d6bb0a1da8ef787a98b9c3436fb534e11317ee32cf08/result`}
          width={width}
        /> */}

        <View style={[ {flex:1, marginHorizontal:0, borderRadius:0, backgroundColor:Colors.surface}]}>
          {loading ? <>
            <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
              <ActivityIndicator color={Colors.secondary} />
            </View>
          </> : <>
            <FlatList
              data={data}
              // maxToRenderPerBatch={5}
              // removeClippedSubviews={false}
              keyExtractor={(item) => item.orderId}
              renderItem={({ item }) => (
                <View style={{ padding: 10, borderBottomWidth: 1, borderColor: Colors.secondary, alignItems:'center' }}>
                  <Text style={{ color: Colors.primary, fontFamily:'SpaceMono-Bold' }}>Order : {item.orderId.substring(0, 10) + '...'}</Text>
                  {/* <Text style={{ color: Colors.primary, fontFamily:'SpaceMono-Bold' }}>{item.url}</Text> */}
                  {/* <CustomButton onPress={() => {
                    fetch(item.url, {
                      method: 'GET',
                      headers : {
                        'Authorization' : `Bearer ${jwtToken}`
                      }
                    }).then(r => {
                      alert(`${r.status} - ${r.statusText} - ${r}`)
                    })
                  }} available={true}><Text>Load</Text></CustomButton> */}
                  {/* <Text style={{ color: Colors.primary }}>{item.url}</Text> */}
                  <VideoPreview
                    orderId={item.orderId}
                    token={`${jwtToken}`}
                    url={`${SERVER_URL}/order/${item.orderId}/result`}
                    width={width}
                  />
                </View>
              )}
            />
          </>}
        </View>
      </View>
    </View>
  </>
}