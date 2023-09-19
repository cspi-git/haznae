(async()=>{
    "use strict";

    require("dotenv").config()

    // Dependencies
    const { Client, Intents, MessageEmbed, Permissions } = require("discord.js")
    const { MongoClient } = require("mongodb")
    const request = require("request-async")
    const hash = require("hash.js")

    // Variables
    const bCommands = require("./commands.json")
    const bot = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MEMBERS ] })

    const client = new MongoClient(process.env.MONGODB_URL)
    const db = client.db(process.env.MONGODB_DB)
    const settings = db.collection(process.env.MONGODB_CL)

    // Functions
    const toSHA512 = (string)=>{return hash.sha512().update(string).digest("hex")}
    async function checkUser(member){
        var response = await request(`${process.env.API_URL}api/v1/haznae?uID=${member.user.id}`)
        response = JSON.parse(response.body).data

        var serverSettings = await settings.findOne({ serverID: toSHA512(member.guild.id) })

        if(!serverSettings){
            await settings.insertOne({ serverID: toSHA512(member.guild.id), reportBan: false })
            serverSettings = await settings.findOne({ serverID: toSHA512(member.guild.id) })
        }

        if(serverSettings.reportBan && response.reported || response.proven) try{
            await member.ban("Malicious actor banned by Haznae.")
        }catch{}
    }

    async function cMembers(){
        bot.guilds.cache.forEach(async(guild)=>{
            await guild.members.fetch()

            guild.members.cache.forEach((member)=>checkUser(member))
        })
    }

    // Main
    bot.on("ready", ()=>{
        bot.guilds.cache.forEach((guild)=>{guild.commands.set([])})
        bot.guilds.cache.forEach((guild)=>{guild.commands.cache.forEach((command)=>{guild.commands.delete(command)})})
    
        const commands = bot.application?.commands
        for( const command of bCommands ) commands?.create(command)

        bot.user.setActivity("Monitoring servers for malicious actors...")
        console.log("Haznae is running.")
        cMembers()
        setInterval(()=>cMembers(), 172800000) // Check every 2 days.
    })

    bot.on("guildMemberAdd", async(member)=>checkUser(member))

    bot.on("interactionCreate", async(interaction)=>{
        if(!interaction.isCommand()) return
    
        if(interaction.commandName === "help"){
            const embed = new MessageEmbed()
            .setTitle("Haznae | Help")
            .setDescription(`**How does Haznae works?**
Haznae automatically bans potential bad actors as soon as they join the Discord server, and also checks existing members.

**How to enable an option so the bot will automatically ban users who are reported?**
Just use the command \`/reportban\` to enable and disable this option.`)
            .setColor("AQUA")
            .setFooter("Brought to you by CSPI.")

            await interaction.reply({ embeds: [embed] })
        }else if(interaction.commandName === "reportban"){
            if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) return await interaction.reply({ content: "No permission to modify the report ban.", ephemeral: true })

            await interaction.reply({ content: "Implementing the option, Please wait...", ephemeral: true })
            const option = interaction.options.getString("option", true)
            var serverSettings = await settings.findOne({ serverID: toSHA512(interaction.guild.id) })

            if(!serverSettings){
                await settings.insertOne({ serverID: toSHA512(interaction.guild.id), reportBan: false })
                serverSettings = await settings.findOne({ serverID: toSHA512(interaction.guild.id) })
            }


            if(option === "enable"){
                if(serverSettings.reportBan) return await interaction.editReply("Report ban is already enabled for this server.")

                await settings.updateOne({ serverID: toSHA512(interaction.guild.id) }, { $set: { reportBan: true } })
                await interaction.editReply("Report ban enabled.")
            }else{
                if(!serverSettings.reportBan) return await interaction.editReply("Report ban is already disabled for this server.")
                await settings.updateOne({ serverID: toSHA512(interaction.guild.id) }, { $set: { reportBan: false } })
                await interaction.editReply("Report ban disabled.")
            }
        }
    })

    bot.login(process.env.BOT_TOKEN)
})()