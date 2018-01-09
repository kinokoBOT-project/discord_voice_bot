const Discord = require('discord.js');
const fs      = require('fs');
require('dotenv').config();

const client = new Discord.Client();
client.login(process.env.TOKEN_ID).catch(() => {
  console.log('TOKEN_IDが間違ってます');
  process.exit();
});

// voiceList配下のファイル一覧を取得
const voiceList = fs.readdirSync('./voiceList');
// .gitkeepを除外
voiceList.shift();

// ボイス名一覧を取得
let voiceIndex = 0;
const voiceNameList = voiceList.map(voice => {
  let voiceName = voiceIndex + ' => ' + voice.split('.')[0];
  voiceIndex++;
  return voiceName;
});

console.log(voiceNameList);

client.on('ready', () => {
  console.log('botの準備ができました');

  // bot用のテキストチャンネルが指定されている場合
  if (typeof process.env.TEXT_CHANNEL_ID !== 'undefined') {
    const textChannel = client.channels.get(process.env.TEXT_CHANNEL_ID);

    // bot用のテキストチャンネルに起動メッセージ送信
    if (typeof textChannel !== 'undefined') {
      textChannel.send('botを起動しました');
    } else {
      console.log('bot用のテキストチャンネルIDが間違ってます');
    }
  }
});

// メッセージ受信イベント
client.on('message', message => {
  const sender        = message.member; // 送信者
  const voiceChannel  = sender.voiceChannel; // 送信者の接続しているボイスチャンネル

  // メッセージが「.」から始まる場合botが反応する
  if (message.content.slice(0, 1) === '.') {

    let botMessage  = message.content.split('.')[1];
    botMessage      = Number.isInteger(botMessage) ? parseInt(botMessage, 10) : botMessage;
    console.log(botMessage);

    // メッセージ内容で何を処理するか判定
    if (botMessage === 'list') {
      // 「.list」で使用可能なコマンドを表示
      const listMessage = [];
      listMessage.push('「.」に続けて以下のメッセージを送信してください');
      listMessage.push('list => 一覧表示');
      listMessage.push('leave => ボイスチャンネルから退出');
      Array.prototype.push.apply(listMessage, voiceNameList);
      // メッセージ送信
      message.channel.send(listMessage);
    } else if (botMessage >= 0 && botMessage < voiceList.length) {
      // 指定されたボイス番号を再生
      if (voiceChannel) {
        // 同じボイスチャンネルに接続
        voiceChannel.join().then(connection => {
          // 指定された音声を再生
          connection.playFile('./voiceList/' + voiceList[botMessage]);
        });
      }
    } else if (botMessage === 'leave') {
      // 「.leave」でボイスチャンネルから退出
      voiceChannel.leave();
    }
  }
});

// ユーザ毎の入室音を取得
const jsonData        = fs.readFileSync('joinedVoiceList.json');
const joinedVoiceList = JSON.parse(jsonData);

client.on('voiceStateUpdate', (oldMember, newMember) => {
  // joinedVoiceList.jsonで定義したユーザ名のみ対象
  if (Object.keys(joinedVoiceList).indexOf(newMember.user.username) !== -1) {
    // ボイスチャンネルに入室した場合
    if (oldMember.voiceChannelID !== newMember.voiceChannelID && newMember.voiceChannelID !== null) {
      // 予め指定された音声を再生する
      const voiceChannel = client.channels.get(newMember.voiceChannelID);
      voiceChannel.join().then(connection => {
        connection.playFile('./voiceList/' + voiceList[joinedVoiceList[newMember.user.username]]);
      });
    }
  }
});
