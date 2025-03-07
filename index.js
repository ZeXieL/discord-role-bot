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
            .setColor(0x3498db); // Gunakan kode warna HEX

        // Buat dropdown menu
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select-role')
                    .setPlaceholder('Pilih warna role...')
                    .addOptions([
                        { label: '🔵 Biru', value: 'BLUE', description: 'Warna biru untuk role Anda' },
                        { label: '🔴 Merah', value: 'RED', description: 'Warna merah untuk role Anda' },
                        { label: '🟢 Hijau', value: 'GREEN', description: 'Warna hijau untuk role Anda' },
                        { label: '🟡 Kuning', value: 'YELLOW', description: 'Warna kuning untuk role Anda' },
                        { label: '⚫ Hitam', value: 'DARK_GREY', description: 'Warna hitam untuk role Anda' },
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
                color: 0xffffff, // Putih
                reason: "Role default untuk semua anggota"
            });
            console.log("✅ Role 'Viewers Elgis' dibuat!");
        }

        // Warna role berdasarkan pilihan
        const colors = {
            BLUE: 0x3498db,
            RED: 0xe74c3c,
            GREEN: 0x2ecc71,
            YELLOW: 0xf1c40f,
            DARK_GREY: 0x2f3136
        };

        let role = guild.roles.cache.find(role => role.name.toUpperCase() === selectedColor);
        if (!role) {
            role = await guild.roles.create({
                name: selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1).toLowerCase(),
                color: colors[selectedColor],
                permissions: [],
                reason: `Role warna ${selectedColor} dipilih`
            });
            console.log(`✅ Role warna ${selectedColor} dibuat!`);
        }

        // Pastikan role warna memiliki prioritas tinggi
        const botRole = guild.members.me.roles.highest;
        if (role.position < botRole.position) {
            await role.setPosition(botRole.position - 1);
        }

        // Hapus role warna lain sebelum menambahkan yang baru
        const colorRoles = Object.values(colors).map(colorHex => 
            guild.roles.cache.find(r => r.color === colorHex)
        ).filter(r => r);

        await member.roles.remove(colorRoles);
        await member.roles.add(role);

        await interaction.reply({ content: `✅ Anda mendapatkan role **${role.name}**!`, flags: 64 });
    }
});

client.login(process.env.TOKEN);
