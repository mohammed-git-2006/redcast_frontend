


export default async function getScriptFromUrl(url:string) : Promise<string|null> {
  var refinedUrl : string = ""
  try {
    refinedUrl = url.split('?')[0]

    if(refinedUrl.includes('/s/')) {
      const response = await fetch(refinedUrl, {
        method: 'HEAD',
        redirect: 'follow',
      });

      refinedUrl = response.url.split('?')[0]
    }

    if (!refinedUrl.endsWith('/')) refinedUrl += '/'
    refinedUrl += '.json'
    const response = await fetch(refinedUrl)
    console.log(`Refined url : ${refinedUrl}`)
    console.log(`Response : ${JSON.stringify(response)}\n\n`)
    const jsonContent = await response.json();
    const post = jsonContent[0]['data'].children[0].data 
    return `${post.title}\n${post.selftext}`
  } catch (err) {
    console.log(`${err}`)
    console.log(`failed to parse the url`)
    return null;
  }
}