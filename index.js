//!!!!!!!!to use this bot, you will need your own discord token and open AI key!!!!!!!!
require("dotenv/config");
const { Client } = require("discord.js");
const { OpenAI } = require("openai");
//imports

//new client
const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

//if server is working currently and bot is online

client.on("ready", () => {
  console.log("Bot is online");
});



//messages start with !
const IGNORE_PREFIX = "!";
const CHANNELS = ["1170853735346471007"];
//discord channel id

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
//open ai API

//on message create, wait for message, check if from a bot or starts with !
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(IGNORE_PREFIX)) return;
  if (
    !CHANNELS.includes(message.channelId) &&
    !message.mentions.users.has(client.user.id)
  )
    return;
  //bot is typing...
  await message.channel.sendTyping();

  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let conversation = [];
  conversation.push({
    role: "system",
    content: "This Chat Box is powered by Chat GPT",
  });

  //cap prev messages at 10 to prevent overloading
  let prevMessages = await message.channel.messages.fetch({
    limit: 10,
  });
  prevMessages.reverse();

  prevMessages.forEach((msg) => {
    if (msg.author.bot && msg.author.id !== client.user.id) return;
    if (msg.content.startsWith(IGNORE_PREFIX)) return;

    const username = msg.author.username
      .replace(/\s+/g, "_")
      .replace(/[^\w\s]/gi, "");

    if (msg.author.id === client.user.id) {
      conversation.push({
        role: "assistant",
        name: username,
        content: msg.content,
      });

      return;
    }
    conversation.push({
      role: "user",
      name: username,
      content: message.content,
    });
  });

  const response = await openai.chat.completions
    .create({
      model: "gpt-3.5-turbo", //free version, usage may need to be upgraded
      messages: conversation,
    })
    .catch((error) => console.error("Error:\n", error));

  clearInterval(sendTypingInterval);

  if (!response) {
    message.reply("OpenAi may be experiencing issues... Please try again");
    return;
  }

  const responseMessage = response.choices[0].message.content;
  const chunkSizeLimit = 2000; //discord limit of charachters

  for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
    const chunk = responseMessage.substring(i, i + chunkSizeLimit);
    await message.reply(chunk);
  }
});

client.login(process.env.TOKEN);
