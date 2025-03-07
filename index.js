require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    EmbedBuilder, 
    PermissionsBitField, 
    Colors 
} = require('discord.js');

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

    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) {
        console.log('⚠️ Channel tidak ditemukan atau bot tidak memiliki akses!');
        return;
    }

    // Buat embed pesan
    const embed = new EmbedBuilder()
        .setTitle('🎨 Katalog Warna')
        .setDescription('Silakan pilih warna untuk username Anda dari menu di bawah ini!')
        .setColor(Colors.Blue);

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
});

// Event saat user memilih dari dropdown menu
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select-role') return;

    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);
    const selectedColor = interaction.values[0];

    // Periksa apakah bot memiliki izin yang cukup
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({ content: "⚠️ Bot tidak memiliki izin untuk mengelola role!", ephemeral: true });
    }

    // Role default "Viewers Elgis"
    let defaultRole = guild.roles.cache.find(role => role.name === "Viewers Elgis");
    if (!defaultRole) {
        defaultRole = await guild.roles.create({
            name: "Viewers Elgis",
            color: Colors.White,
            reason: "Role default untuk semua anggota"
        }).catch(err => console.error("❌ Gagal membuat role default:", err));
    }

    // Warna role berdasarkan pilihan
    const colors = {
        blue: Colors.Blue,
        red: Colors.Red,
        green: Colors.Green,
        yellow: Colors.Yellow,
        black: Colors.DarkGrey
    };

    let role = guild.roles.cache.find(role => role.name.toLowerCase() === selectedColor);
    if (!role) {
        role = await guild.roles.create({
            name: selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1),
            color: colors[selectedColor],
            reason: `Role warna ${selectedColor} dipilih`
        }).catch(err => console.error(`❌ Gagal membuat role warna ${selectedColor}:`, err));
    }

    if (!role) return interaction.reply({ content: "⚠️ Gagal menemukan atau membuat role!", ephemeral: true });

    // Hapus role warna lain sebelum menambahkan yang baru
    const colorRoles = Object.keys(colors)
        .map(c => guild.roles.cache.find(r => r.name.toLowerCase() === c))
        .filter(r => r);
    
    await member.roles.remove(colorRoles).catch(() => {});
    await member.roles.add(defaultRole).catch(() => {});
    await member.roles.add(role).catch(() => {});

    await interaction.reply({ content: `✅ Anda mendapatkan role **${role.name}**!`, ephemeral: true });
});

// Jalankan bot
client.login(process.env.TOKEN);
