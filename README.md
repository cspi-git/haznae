# Haznae
Haznae is a simple Discord bot that will protect your Discord server from any malicious users on your server, including botting, raiding and more.

## Installation
Github:
```
git clone https://github.com/cspi-git/haznae
```

NpmJS:
```
npm i dotenv discord.js@13.3.1 mongodb request-async hash.js
```

## Setup
1. Rename the **.env.example** file to **.env**, then put your Discord bot token in the **BOT_TOKEN** field.
2. Create a database, then put the database link in the **MONGODB_URL** field. https://mongodb.com/
3. In your MongoDB make a database called **core** and a collection called **haznae.servers**.

## Usage
```
node index.js
```

## License
MIT © CSPI