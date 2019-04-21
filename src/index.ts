import * as discord from 'discord.js';
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' });
import exitHook = require('exit-hook');
import { Commands } from './commands';
import { Filters } from './filters';
import { YTWebhookManager } from './youtube';
import { Catcher } from './catcher';
import { Logger } from './database/logger';
import { Database } from './database/database';
import { MStats } from './database/mStats';
import { botToken, DBURI } from './bot-config.json';
import { MEMBER, getPermissionLevel } from './utils/permissions';

export class Bot {
    static client: discord.Client;
    static commands: Commands;
    static filters: Filters;
    static youtube: YTWebhookManager;
    static database: Database;
    static mStats: MStats;
    static catcher: Catcher;
    static logger: Logger;

    static init(client: discord.Client, commands: Commands, filters: Filters, youtube: YTWebhookManager,
        database: Database, mStats: MStats, catcher: Catcher, logger: Logger) {
        this.client = client;
        this.commands = commands;
        this.filters = filters;
        this.youtube = youtube;
        this.database = database;
        this.mStats = mStats;
        this.catcher = catcher;
        this.logger = logger;
    }
}

var mStats = new MStats(DBURI, 'admin');
var database = new Database(DBURI, 'admin');
var logger = new Logger(DBURI, 'admin');
var client = new discord.Client();
var commands = new Commands(__dirname + "/commands/");
var filters = new Filters();
var youtube = new YTWebhookManager();
var catcher = new Catcher();
Bot.init(client, commands, filters, youtube, database, mStats, catcher, logger);

client.on('ready', () => {
    console.info('Bot is ready');
});

client.on('error', error => {
    Bot.mStats.logError();
    console.error('from client.on():', error);
});

client.on('message', async message => {
    if (message.author.bot) return;
    var requestTimestamp = new Date().getTime();
    Bot.mStats.logMessageRecieved();
    var dm = false;
    if (!message.guild) {
        dm = true;
    }

    // if message is only a mention of the bot, he dms help
    if (message.content == "<@" + Bot.client.user.id + ">") {
        message.author.createDM().then(dmChannel => {
            message.channel = dmChannel;
            Bot.commands.runCommand(message, '', 'help', MEMBER, true, requestTimestamp);
            Bot.commands.runCommand(message, 'help', 'help', MEMBER, true, requestTimestamp);
        });
        return;
    }

    var permLevel = MEMBER;
    if (!dm) {
        permLevel = await getPermissionLevel(message.member);
    }
    var prefix = await Bot.database.getPrefix(message.guild);
    if (!message.content.startsWith(prefix)) {
        if (!message.content.toLowerCase().startsWith(Bot.database.settingsDB.cache.prefix + 'prefix')) {
            if (!dm) {
                // TODO: filter message
            }
            return;
        }
    }
    // if the command is ?!prefix isn't ?!
    if (prefix != Bot.database.settingsDB.cache.prefix && message.content.startsWith(Bot.database.settingsDB.cache.prefix)) {
        prefix = Bot.database.settingsDB.cache.prefix;
    }

    var command = message.content.split(" ")[0].slice(prefix.length).toLowerCase();
    var args = message.content.slice(prefix.length + command.length + 1);

    Bot.commands.runCommand(message, args, command, permLevel, dm, requestTimestamp);
});

client.on('reconnecting', () => {
    console.warn('Lost client connection. Reconnecting...');
})

client.on('resume', missed => {
    console.info(`Successfully reconnected client. Missed ${missed} events.`)
})

client.on('debug', info => {
    //console.debug(info);
});

client.on('warn', info => {
    console.warn(info);
})

setTimeout(() => {
    client.login(botToken);
}, 2000);
