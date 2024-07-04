const TelegramBot = require("node-telegram-bot-api"); //telegram bot api
const WebSocket = require("ws"); //websocket
require("dotenv").config(); // get data from .env

//custom modules
const manage_telegram_bot = require("./Telegram"); //handle telegram bot
const manage_socket = require("./Socket");

//credentials
const TOKEN = process.env.TOKEN; //telegram bot token
const WS_PORT = process.env.WS_PORT; //websocket port
const KEY = process.env.KEY; //telegram admin join key
const ADMIN = process.env.ADMIN; //admin telegeram chat id to make bot only admin

//dynamic values
ONLY_ADMIN_MODE=true

//store
const admins  = {}; //store all telegram admins
const devices = {}; //store all devices

//telegram bot
const bot = new TelegramBot(TOKEN,{polling:true});
bot.onText(/\/start/,(msg)=>{manage_telegram_bot.start(msg,bot,admins,devices)});
bot.onText(/\/stop/,(msg)=>{manage_telegram_bot.stop(msg,bot,admins)});
bot.onText(/\/status/,(msg)=>{manage_telegram_bot.status(msg,bot,admins)});
bot.onText(/\/devices/,(msg)=>{manage_telegram_bot.devices(msg,bot,admins,devices)});
bot.onText(/\/selected/,(msg)=>{manage_telegram_bot.selected(msg,bot,admins,devices)});
bot.onText(/\/options/,(msg)=>{manage_telegram_bot.options(msg,bot,admins,devices)});
bot.onText(/\/cancel/,(msg)=>{manage_telegram_bot.abort(msg,bot,admins,devices)});
bot.onText(/\/t/,(msg)=>{
    const longMessage = `
<b>Title</b>

This is a long message that explains something in detail. You can use <b>bold</b> text, <i>italic</i> text, and <a href="https://example.com">links</a>.

<pre>Hello bitches
i am gonna give you a day to live
</pre>
`;

bot.sendMessage(msg.chat.id, longMessage, {parse_mode: 'HTML'});
})
bot.on('message',(msg)=>{manage_telegram_bot.message(msg,bot,admins,devices)});
bot.on('callback_query',(msg)=>{manage_telegram_bot.callback_query(msg,bot,admins,devices)});
bot.on('polling_error',(error)=>{console.error('Polling error occurred:', error.code, error.message);console.error(error.stack);})


//websocket
const wss = new WebSocket.Server({port:WS_PORT});
wss.on('listening',()=>{console.log(`Websocket server on port : ${WS_PORT}`)})
wss.on('connection',(socket,req)=>{
    const url = (req.url).substring(1);
    manage_socket.newConnection(url,devices,socket,bot,admins)
    socket.on('message',(data)=>{manage_socket.handleMessage(data.toString(),url,socket,bot,admins)})
    socket.on('close',()=>manage_socket.handleSocketClose(devices,url,admins,bot))
});