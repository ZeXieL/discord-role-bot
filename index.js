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
    if (!channel) return console.log('⚠️ Channel tidak ditemukan!');

    // **Cek apakah sudah ada pesan embed sebelumnya**
    const messages = await channel.messages.fetch({ limit: 10 }); // Ambil 10 pesan terakhir
    const existingMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title === '🎨 Katalog Warna');

    if (!existingMessage) {
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
        console.log('✅ Embed role menu berhasil dikirim!');
    } else {
        console.log('⏩ Pesan role menu sudah ada, tidak dikirim ulang.');
    }
});

// Event saat user memilih dari dropdown menu
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select-role') {
        const guild = interaction.guild;
        const member = await guild.members.fetch(interaction.user.id);
        const selectedColor = interaction.values[0];

        // Cek role bot sendiri
        const botRole = guild.members.me.roles.highest;

        // Warna role berdasarkan pilihan
        const colors = {
            BLUE: 0x3498db,
            RED: 0xe74c3c,
            GREEN: 0x2ecc71,
            YELLOW: 0xf1c40f,
            DARK_GREY: 0x2f3136
        };

        // Dapatkan semua role warna yang mungkin ada
        const colorRoles = Object.keys(colors).map(colorName => 
            guild.roles.cache.find(role => role.name.toUpperCase() === colorName)
        ).filter(role => role && member.roles.cache.has(role.id)); // Pastikan hanya yang dimiliki oleh member

        // Cek apakah bot memiliki izin mengelola role
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            console.log("⚠️ Bot tidak memiliki izin untuk mengelola role!");
            return interaction.reply({ content: "⚠️ Saya tidak memiliki izin untuk mengelola role!", ephemeral: true });
        }

        // Cek apakah role dengan warna yang dipilih sudah ada, jika tidak buat baru
        let role = guild.roles.cache.find(role => role.name.toUpperCase() === selectedColor);
        if (!role) {
            role = await guild.roles.create({
                name: selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1).toLowerCase(),
                color: colors[selectedColor],
                position: botRole.position - 1, // Pastikan role lebih rendah dari bot
                permissions: [],
                reason: `Role warna ${selectedColor} dipilih`
            });
            console.log(`✅ Role warna ${selectedColor} dibuat!`);
        }

        try {
            // Hapus semua role warna sebelumnya dan tambahkan yang baru
            await Promise.all([
                member.roles.remove(colorRoles),
                member.roles.add(role)
            ]);
            await interaction.reply({ content: `✅ Anda mendapatkan role **${role.name}**!`, ephemeral: true });
        } catch (error) {
            console.error("❌ Gagal mengubah role:", error);
            await interaction.reply({ content: "❌ Saya tidak bisa mengubah role Anda. Pastikan role saya lebih tinggi!", ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
