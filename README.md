
i build a Persona using my own facial , voice information
 
Show My First Persona using HTML and Javascript 

I also  creates a WebRTC connection for real-time video streaming and it also has voice interaction and connection control




How to use it :
                  input :  npx http-server -p 8000
                  Click “Start Chat” to begin your conversation with Fiona
                  
In server.js, Express has two port, one for /seesion-token, another one for /chat which connect openai API

前端 -> /session-token -> Anam 前端 -> /chat -> OpenAI

Main Structure :




[Frontend]
  ├─ 页面加载 -> POST /session-token -> createClient(sessionToken)
  └─ 用户发问 -> POST /chat -> 得到 reply

[Express Backend]
  ├─ /session-token -> 向 Anam 换 token
  └─ /chat -> 向 OpenAI 请求回答

[Later]
  └─ 再研究如何把 reply 送进 Anam persona
