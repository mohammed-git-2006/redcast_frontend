import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserProfile {
  name? : string,
  tokens? : number,
  result? : string[],
  orderId? : string,
  email? : string,
  gens? :number,
  generating? : boolean
}

export async function loadUserFromStorage() : Promise<UserProfile> {
  const userItem = await AsyncStorage.getItem("user") ?? '{}';
  return <UserProfile>JSON.parse(userItem);
}

export function loadUserFromFirebase(id: string) : UserProfile {
  return {};
}

export function saveUserToStorage(userProfile : UserProfile) {
  AsyncStorage.setItem('user', JSON.stringify(userProfile));
}

export async function loadUserFromServer(jwtToken:string) : Promise<UserProfile|'connerr'|'tokenerr'> {
  try {
    const response = await fetch(`${SERVER_URL}/user/info`, {
      method: 'POST',
      headers : {
        'Authorization' : 'Bearer '.concat(jwtToken) 
      }
    });

    const parsedResult = await response.json()
    if (!parsedResult.status) {
      return 'tokenerr'
    }

    return parsedResult as UserProfile
  } catch (err) {
    return 'connerr';
  }
}

export const SERVER_URL:string = "http://redcast.local:8080"