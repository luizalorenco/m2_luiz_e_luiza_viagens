const env = require('../.env')
const common = require('../common.env')
const { Telegraf, Markup } = require('telegraf')
const fetch = require("node-fetch")
const LocalSession = require('telegraf-session-local')
const request = require('request')

const regions = common.regions;
var states = common.states;
const actions = ['Listar viagens', 'Cadastrar nova viagem',  'Excluir viagem', 'Atualizar viagem']

const bot = new Telegraf(env.token)

var apiToken = '';

bot.use(new LocalSession({ database: 'example_db.json' }).middleware())

async function updateAPIToken() {
    var body = {
        email: env.apicredentials.email, 
        password: env.apicredentials.password
    }
    fetch(env.apiBase + '/users/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
        .then(json => apiToken = json.token)
        .catch (err => console.log(err))
}

updateAPIToken();

async function createTrip(usuario, estado, ano) {
    updateAPIToken();
    var body = {
        usuario: usuario, 
        estado: estado,
        ano: ano
    }
    var response;
    fetch(env.apiBase + '/trips', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
        .then(json => response = json)
        .catch (err => console.log(err))
    return await response;
}

async function updateTrip(id, ano) {
    updateAPIToken();
    var body = {
        ano: ano
    }
    var response;
    fetch(env.apiBase + '/trips/' + id, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
        .then(json => response = json.message)
        .catch (err => console.log(err))
    return await response;
}

bot.start(async ctx => {
    const from = ctx.update.message.from
    await ctx.reply(`Olá! Seja bem vindo ${from.first_name}`)
    await ctx.reply(
        `Eu sou o bot Viagens Brasileiras, criado por Luiz e Luiza.
        Minha função é salvar suas viagens para os estados brasileiros. Para qual região você já viajou?`,
        Markup.keyboard(regions).resize().oneTime()
    )
})

bot.hears(regions, async ctx => {
    updateAPIToken();
    await ctx.reply(` Legal! Para qual estado você viajou? `)
    var message = ctx.message.text
    request(`${env.apiEstados}/${message}`, async (err, res, body) => {
        var response = JSON.parse(body)
        var keyboardvalues = []
        response.forEach(element => {
            keyboardvalues.push(element.nome)
        });
        await ctx.reply(
            `Aqui estão todos dessa região:`,
            Markup.keyboard(keyboardvalues).resize().oneTime()
        )}
    )
})

 

bot.hears(states, async ctx => {
    var currentstate = ctx.update.message.text
    ctx.session.currentstate = currentstate;
    ctx.session.action = 'create';
    await ctx.reply('Interessante! E qual foi o ano dessa viagem?')
})

let list = []

  // criando um 'Inline Keyboar' dinâmico
const itemsButtons = () =>
    Markup.inlineKeyboard(
    list.map(item => Markup.button.callback(item, `remove ${item}`)),
    { columns: 3 }
)

// obtendo o item e o transformando em um botão da lista
const onlyNumbers = new RegExp('^[0-9]+$')

bot.hears(onlyNumbers, async ctx => {
    var message = ctx.update.message.text
    if (message.length === 4) {
        var action = ctx.session.action;
    
        switch (action) {
            case 'create':
                list.push(ctx.update.message.text)
                console.log(list)
                var currentstate = ctx.session.currentstate
                var year = ctx.update.message.text
                var userID = ctx.update.message.from.id
    
                await createTrip(userID, currentstate, year)
    
                ctx.reply(
                    `A viagem para ${currentstate} no ano de ${ctx.update.message.text} foi adicionada à lista! O que deseja fazer agora?`,
                    Markup.keyboard(actions).resize().oneTime(),
                    itemsButtons()
                )
                ctx.session.currentstate = null;
                ctx.session.action = null;
                break;
            case 'update':
                tripID = ctx.session.currenttrip;
                var year = ctx.update.message.text
                await updateTrip(tripID, year);
                ctx.reply(
                    `A viagem foi alterada com sucesso! O que deseja fazer agora?`,
                    Markup.keyboard(actions).resize().oneTime(),
                    itemsButtons()
                )
                ctx.session.currenttrip = null;
                ctx.session.action = null;
                break;
            default:
                ctx.session.currentstate = null;
                ctx.session.currenttrip = null;
                ctx.session.action = null;
                ctx.reply(
                    `Não entendi a sua solicitação, o que devemos fazer agora?`,
                    Markup.keyboard(actions).resize().oneTime(),
                    itemsButtons()
                )
                break;
        }
    } else {
        ctx.reply(
            `Por gentileza, digite um ano valido`
        )
    }
})
     
   // removendo os itens da lista quando clicar no botão
bot.action(/remove (.+)/, ctx => {
    var id = ctx.match[1]

    fetch(env.apiBase + '/trips/' + id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
    .then((json) => {

        ctx.reply(
            `A viagem foi removida da sua lista!`,
            Markup.keyboard(actions).resize().oneTime(),
            itemsButtons()
        )
    })
})

bot.action(/update (.+)/, ctx => {
    var id = ctx.match[1]

    ctx.session.currenttrip = id;
    ctx.session.action = 'update';

    ctx.reply('Para qual ano da viagem você gostaria de alterar?')
})

bot.hears('Cadastrar nova viagem',
ctx => {
    ctx.reply( 'Para qual região você viajou?',
    Markup.keyboard(regions).resize().oneTime()
)})
  
bot.hears('Listar viagens',ctx => {
    updateAPIToken();
    var userID = ctx.update.message.from.id

    fetch(env.apiBase + '/trips/' + userID, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
    .then((json) => {

        const myTrips = () =>
        Markup.inlineKeyboard(
            json.map(
                item => Markup.button.callback(item.estado + ' - ' + item.ano, `${item.estado}`)
            ),
            { columns: 2 }
        )
    
        ctx.reply(
            'Aqui estão todas as suas viagens cadastradas:',
            myTrips()
        ).then(() => {
            ctx.reply(
                'O que devemos fazer agora?',
                Markup.keyboard(actions).resize().oneTime(),
                itemsButtons()
            )
        })
        
    })
    .catch (err => console.log(err))
    
})

bot.hears('Excluir viagem',ctx => {
    var userID = ctx.update.message.from.id
  
    fetch(env.apiBase + '/trips/' + userID, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
    .then((json) => {

        var myTrips = () => Markup.inlineKeyboard(
            json.map(
                item => Markup.button.callback(item.estado + ' - ' + item.ano, `remove ${item.id}`)
            ),
            { columns: 2 }
        )
        

        ctx.reply(
            'Clique sobre uma das viagens de sua lista para excluir. Essa acção não será desfeita.',
            myTrips()
        )
    })
})

bot.hears('Atualizar viagem',ctx => {
    var userID = ctx.update.message.from.id
  
    fetch(env.apiBase + '/trips/' + userID, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
    .then((json) => {

        var myTrips = () => Markup.inlineKeyboard(
            json.map(
                item => Markup.button.callback(item.estado + ' - ' + item.ano, `update ${item.id}`)
            ),
            { columns: 2 }
        )
        

        ctx.reply(
            'Clique sobre uma das viagens de sua lista para alterar. Essa ação não será desfeita.',
            myTrips()
        )
    })
})


bot.startPolling()