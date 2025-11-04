const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;  
const CHANNEL_ID = "1435099961053155509";  
const SPARKLE_EMOJIS = ["✨", "💫", "🌟"];  
const ANIMATION_DELAY = 500;  

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,  
        GatewayIntentBits.GuildMessageReactions
    ]
});

let counterMessageId = null; 

function createCounterEmbed(count) {
    return new EmbedBuilder()
        .setTitle("🌺 Welcome to OCA!")
        .setDescription(
            `### We are now **${count}** members strong!\n\n` +
            `*Thank you for being part of our community*`
        )
        .setColor(0xFFB6C1)
        .setFooter({ text: "OCA Student Server 💖" })
        .setTimestamp();
}

// Function to update the counter embed
async function updateCounterEmbed() {
    if (!counterMessageId) return;
    
    try {
        const channel = client.channels.cache.get(CHANNEL_ID);
        if (!channel) return;
        
        const msg = await channel.messages.fetch(counterMessageId);
        const count = channel.guild.memberCount;
        
        await msg.edit({ embeds: [createCounterEmbed(count)] });
        console.log(`Counter updated to ${count} members`);
    } catch (error) {
        console.error("Error updating counter:", error);
    }
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    const channel = client.channels.cache.get(CHANNEL_ID);

    if (!channel) {
        console.error("Channel not found!");
        return;
    }

    try {
        const pinnedMessages = await channel.messages.fetchPinned();
        const counterMessage = pinnedMessages.find(msg => 
            msg.embeds.length > 0 && 
            msg.embeds[0].description && 
            msg.embeds[0].description.includes("members strong")
        );

        if (counterMessage) {
            counterMessageId = counterMessage.id;
            console.log("Found existing counter message:", counterMessageId);
        } else {
            const count = channel.guild.memberCount;
            const msg = await channel.send({ embeds: [createCounterEmbed(count)] });
            counterMessageId = msg.id;
            await msg.pin();
            console.log("Created new counter message:", counterMessageId);
        }

        // Start the 1-minute update interval
        setInterval(updateCounterEmbed, 60000); // 60000 ms = 1 minute
        console.log("Started 1-minute update interval");

    } catch (error) {
        console.error("Error in ready event:", error);
    }
});

client.on('guildMemberAdd', async (member) => {
    await new Promise(resolve => setTimeout(resolve, 1000));  
    
    const channel = client.channels.cache.get(CHANNEL_ID);
    
    if (!channel || !counterMessageId) {
        console.error("Channel or counter message not found!");
        return;
    }

    try {
        const msg = await channel.messages.fetch(counterMessageId);
        const count = member.guild.memberCount;
        
        await msg.edit({ embeds: [createCounterEmbed(count)] });

        for (const emoji of SPARKLE_EMOJIS) {
            await msg.react(emoji);
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            
            const reaction = msg.reactions.cache.get(emoji);
            if (reaction) {
                await reaction.remove();
            }
        }
    } catch (error) {
        console.error("Error in member join event:", error);
    }
});

client.on('error', (error) => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

client.login(TOKEN);