const env = require('../.env')
const { Telegraf, Markup } = require('telegraf')
const fetch = require("node-fetch")
const LocalSession = require('telegraf-session-local')
const request = require('request')

const regions = ['Sul', 'Norte',  'Nordeste', 'Centro-Oeste', 'Sudeste']
const actions = ['Listar viagens', 'Cadastrar nova viagem',  'Excluir viagem', 'Atualizar viagem']

var states = []

const bot = new Telegraf(env.token)

var apiToken = '';

bot.use(new LocalSession({ database: 'example_db.json' }).middleware())

request(`${env.apiEstados}`, async (err, res, body) => {
  var response = JSON.parse(body)
  response.forEach(element => {
   states.push(element.nome)
  });

})

async function setapitoken() {
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

setapitoken();

async function createTrip(usuario, estado, ano) {
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
        .then(json => response = json.token)
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

 

  bot.hears(['Acre',
    'Alagoas',
    'Amapá',
    'Amazonas',
    'Bahia',
    'Ceara',
    'Distrito Federal',
    'Espírito Santo',
    'Goiás',
    'Maranhão',
    'Mato Grosso',
    'Mato Grosso do Sul',
    'Minas Gerais',
    'Pará',
    'Paraíba',
    'Paraná',
    'Pernambuco',
    'Piauí',
    'Rio de Janeiro',
    'Rio Grande do Norte',
    'Rio Grande do Sul',
    'Rondônia',
    'Roraima',
    'Santa Catarina',
    'São Paulo',
    'Sergipe',
    'Tocantins'], ctx => {
    var currentstate = ctx.update.message.text
    ctx.session.currentstate = currentstate
    ctx.reply('Interessante! E qual foi o ano dessa viagem?')
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
})
     

bot.hears('Cadastrar nova viagem',
ctx => {
    ctx.reply( 'Para qual região você viajou?',
    Markup.keyboard(regions).resize().oneTime()
)})
  
bot.hears('Listar viagens',ctx => {

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
            { columns: 3 }
        )
    
        ctx.reply(
             'Aqui estão todas as suas viagens cadastradas:',
             myTrips()
        )
        
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

        const myTrips = () =>
        Markup.inlineKeyboard(
            json.map(
                item => Markup.button.callback(item.estado + ' - ' + item.ano, `${item.estado}`)
            ),
            { columns: 3 }
        )

  ctx.reply(
    'Clique sobre uma das viagens de sua lista para excluir. Essa acção não será desfeita.',
    myTrips(),
bot.action(/remove (.+)/, ctx => {
  list = list.filter(item => item !== ctx.match[1])
/ ctx.reply(`A viagem ${ctx.match[1]} foi removida da sua lista!`, myTrips())
})
)})
})


bot.startPolling()