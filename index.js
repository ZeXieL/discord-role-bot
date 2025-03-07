require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

// ID channel tempat menu role dikirim
const CHANNEL_ID = '1347430050890252312';

client.once('ready', async () => {
    console.log(`✅ Bot ${client.user.tag} is online!`);

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
        // Buat embed pesan
        const embed = new EmbedBuilder()
            .setTitle('🎨 Katalog Warna')
            .setDescription('Silahkan pilih roles sesuai dengan keinginan kamu untuk menampilkan warna pada username yang tersedia dibawah sini!')
            .setColor('Blue');

        // Buat dropdown menu
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select-role')
                    .setPlaceholder('Pilih warna role...')
                    .addOptions([
                        { label: '🔵 Biru', value: 'blue', description: 'Warna biru untuk role Anda' },
                        { label: '🔴 Merah', value: 'red', description: 'Warna merah untuk role Anda' },
                        { label: '🟢 Hijau', value: 'green', description: 'Warna hijau untuk role Anda' },
                        { label: '🟡 Kuning', value: 'yellow', description: 'Warna kuning untuk role Anda' },
                        { label: '⚫ Hitam', value: 'black', description: 'Warna hitam untuk role Anda' },
                    ])
            );

        await channel.send({ embeds: [embed], components: [row] });
    } else {
        console.log('⚠️ Channel tidak ditemukan!');
    }
});

// Event saat user memilih dari dropdown menu
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select-role') {
        const guild = interaction.guild;
        const member = await guild.members.fetch(interaction.user.id);
        const selectedColor = interaction.values[0];

        // Role default "Viewers Elgis"
        let defaultRole = guild.roles.cache.find(role => role.name === "Viewers Elgis");
        if (!defaultRole) {
            defaultRole = await guild.roles.create({
                name: "Viewers Elgis",
                color: "WHITE",
                reason: "Role default untuk semua anggota"
            });
            console.log("✅ Role 'Viewers Elgis' dibuat!");
        }

        // Warna role berdasarkan pilihan
        const colors = {
            blue: 'BLUE',
            red: 'RED',
            green: 'GREEN',
            yellow: 'YELLOW',
            black: 'DARK_GREY'
        };

        let role = guild.roles.cache.find(role => role.name.toLowerCase() === selectedColor);
        if (!role) {
            role = await guild.roles.create({
                name: selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1),
                color: colors[selectedColor],
                reason: `Role warna ${selectedColor} dipilih`
            });
            console.log(`✅ Role warna ${selectedColor} dibuat!`);
        }

        // Hapus role warna lain sebelum menambahkan yang baru
        const colorRoles = Object.keys(colors).map(c => guild.roles.cache.find(r => r.name.toLowerCase() === c)).filter(r => r);
        await member.roles.remove(colorRoles);

        // Tambahkan role default dan warna baru ke user
        await member.roles.add(defaultRole);
        await member.roles.add(role);

        await interaction.reply({ content: `✅ Anda mendapatkan role **${role.name}**!`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
