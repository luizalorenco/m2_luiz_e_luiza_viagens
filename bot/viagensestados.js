const env = require('../.env')

const { Telegraf, Markup } = require('telegraf')

const bot = new Telegraf(env.token)

const LocalSession = require('telegraf-session-local')

bot.start(async ctx => {
    const from = ctx.update.message.from
    await ctx.reply(`Olá! Seja bem vindo ${from.first_name}`)
    await ctx.reply(
      `Eu sou o bot Viagens Brasileiras, criado por Luiz e Luiza.
      Minha função é salvar suas viagens para os estados brasileiros. Para qual região você já viajou?
      Legal!
      Os estados dessa região são:`,
      Markup.keyboard(['Sul', 'Norte',  'Nordeste', 'Centro Oeste', 'Sudeste']).resize().oneTime()
    )
  })

  bot.startPolling()