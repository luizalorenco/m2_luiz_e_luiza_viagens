const env = require('../.env')

const { Telegraf, Markup } = require('telegraf')

const bot = new Telegraf(env.token)

const LocalSession = require('telegraf-session-local')

const request = require('request')

const regions = ['Sul', 'Norte',  'Nordeste', 'Centro-Oeste', 'Sudeste']

const actions = ['Listar viagens', 'Cadastrar nova viagem',  'Excluir viagem', 'Atualizar viagem']

var states = []

bot.use(new LocalSession({ database: 'example_db.json' }).middleware())

request(`${env.apiEstados}`, async (err, res, body) => {
  var response = JSON.parse(body)
  response.forEach(element => {
   states.push(element.nome)
  });

 })

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
    await ctx.reply(` Legal!
    Os estados dessa região são:`)
    var message = ctx.message.text
  request(`${env.apiEstados}/${message}`, async (err, res, body) => {
   var response = JSON.parse(body)
   var keyboardvalues = []
   response.forEach(element => {
    keyboardvalues.push(element.nome)
   });
   await ctx.reply(
`Então, para qual estado você viajou?`,
    Markup.keyboard(keyboardvalues).resize().oneTime()
  )
  })})

 

  bot.hears(states, ctx => {
    var currentstate = ctx.update.message.text
    ctx.session.currentstate = currentstate
    ctx.reply('Interessante! E qual foi o ano dessa viagem?')
  })

  let list = []

  // criando um 'Inline Keyboar' dinâmico
  // const itemsButtons = () =>
  //   Markup.inlineKeyboard(
  //     list.map(item => Markup.button.callback(item, `remove ${item}`)),
  //     { columns: 3 }
  //   )

    
  //     // obtendo o item e o transformando em um botão da lista
  // bot.on('text', ctx => {
  //   list.push(ctx.update.message.text)
  //   console.log(list)
  //   var currentstate = ctx.session.currentstate
  //   ctx.reply(
  //     `A viagem para ${currentstate} no ano de ${ctx.update.message.text} foi adicionada à lista!`,
  //     ctx.reply('Viagem cadastrada com sucesso! O que deseja fazer agora?' ),
  //     Markup.keyboard(actions).resize().oneTime(),
  //     itemsButtons()
  //   )
  // })
  
  // // removendo os itens da lista quando clicar no botão
  // bot.action(/remove (.+)/, ctx => {
  //   list = list.filter(item => item !== ctx.match[1])
  //   ctx.reply(`A viagem ${ctx.match[1]} foi removida da sua lista!`, itemsButtons())
  // })


  

  bot.startPolling()