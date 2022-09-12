import { Telegraf, Markup } from 'telegraf';
import { Token } from './config.js';
import { ApiId} from './config.js';
import pkg from 'pg';
const { Client } = pkg;
import { bd_connect } from './bd.js'
import fetch from "node-fetch";
const config_bd = bd_connect
const pic = 'https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg'


const client = new Client(config_bd)
client.connect(async (err) => {
    if (err) console.log(err);
    else {
        console.log("All is OK");
    }
});

const bot = new Telegraf(Token);
const start_hello = 'Здравствуйте. Нажмите на любую интересующую Вас кнопку'
let rassul_flag = false

bot.start((ctx) => ctx.reply(start_hello, main_menu(ctx)))
bot.on('text', (ctx) => {
    switch (ctx.message.text) {
        case ("Хочу почитать!"): read_python(ctx); ; break;
        case ("Погода в Канаде"): weather(ctx); break;
        case ("Сделать рассылку"): ctx.replyWithHTML(`<b>Вы выбрали рассылку всем пользователям. Вы уверен что хотите это сделать?</b>`, shure()); break;
        case ("Отмена"): ctx.reply('😞',otm()); break;
        case ("Уверен"): rassul_flag = true; ctx.replyWithHTML(`<b>Введите сообщение, которое хотите отправить всем пользователям.</b>`);  break;
        default: if(rassul_flag) {rassul(ctx);}
        else {ctx.reply('Извините, я пока не настолько умный')} 
        break;
    }})

    function rassul(contx){
        let message_text = contx.message.text
        const chat_id = contx.from.id
        const text_command = 'Select chat_id from "users" where chat_id != $1'
        const vars_command = [chat_id]
        try {
            client.query(text_command, vars_command, async (err, res) => {
                if (err) {
                    console.log(err.stack)
                } else {
                    for (let i=0; i<res.rowCount; i++)
                    {
                        contx.telegram.sendMessage(res.rows[i].chat_id, message_text)
                    }
                    contx.reply('Сообщение успешно доставлено', otm())
                }
            })
        }
        catch{}
    }

function otm()
{
    rassul_flag = false
    return Markup.keyboard([
        ["Погода в Канаде"],
        ["Хочу почитать!"],
        ["Сделать рассылку"]
    ]).resize();
}

function shure(){
    return Markup.keyboard([
        ["Уверен", "Отмена"]
    ]).resize();
}

function read_python(cont){
    let caption_pic = 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.'
    cont.replyWithPhoto(pic, {
        caption: caption_pic
    })
    cont.replyWithDocument({source: './karmaniy_spravochnik_po_piton.zip'})
}

function weather(context){
    let temperature, temperature_feel, message
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=Ottava&appid=${ApiId}`)
    .then(function (resp){return resp.json()})
    .then(function (data){
        temperature = data.main.temp-273,15
        temperature = temperature.toFixed(2)
        temperature_feel = data.main.feels_like-273,15
        temperature_feel =temperature_feel.toFixed(2)
        message=`Погода в городе Оттава, Канада: \nТемпература: ${temperature}\n Ощущается как: ${temperature_feel}`
        context.reply(message)
    })
    .catch()
}

function main_menu(cont) {
    const username = '@' + cont.from.username
    const chat_id = cont.from.id
    const tetx_main_check = 'Select * from "users" where username = $1'
    const values_main_check = [username]
    try {
        client.query(tetx_main_check, values_main_check, async (err, res) => {
            if (err) {
                console.log(err.stack)
            } else {
                if (res.rowCount == 0) {
                    const tetx_main = 'INSERT INTO "users" (username, first_name, chat_id) VALUES ($1, $2, $3)'
                    const values_main = [username, cont.from.first_name, chat_id]
                    try {
                        client.query(tetx_main, values_main);
                    }
                    catch (err) { console.log(err.stack) }

                }
                else {
                    const tetx_main_upd = 'Update "users" set username = $1, first_name= $2, chat_id = $3 where username = $1'
                    const values_main_upd = [username, cont.from.first_name, chat_id]
                    try {
                        await client.query(tetx_main_upd, values_main_upd);
                    }
                    catch (err) { console.log(err.stack) }
                }
            }
        });
    }
    catch { }
    return Markup.keyboard([
        ["Погода в Канаде"],
        ["Хочу почитать!"],
        ["Сделать рассылку"]
    ]).resize();
}
bot.launch();

