const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const axios = require('axios');
const config = require('./config.json');

const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
  steam: client,
  community: community,
  language: 'en'
});

const logOnOptions = {
  accountName: config.username,
  password: config.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
};

client.logOn(logOnOptions);

client.on('loggedOn', () => {
  console.log('Logged into Steam');

  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed(440);
});

client.on('webSession', (sessionid, cookies) => {
  manager.setCookies(cookies);

  community.setCookies(cookies);
  community.startConfirmationChecker(10000, config.idSecret);
});

client.on('friendRelationship', function (steamID, relationship) {
  if (relationship == 2) {
      logger.correct(` | NEW NOTIFICATION |: Steam ID: ${steamID.getSteamID64()} has added us!`);
      client.addFriend(steamID, (err, name) => {
          if (err) {
              logger.error(`| NEW FRIEND |: Error trying to add ${steamID.getSteamID64()}. Reason: ${err.toString()} `);
          } else if (name) {
              logger.correct(` | NEW FRIEND |: Succesfully added ${name} to friendlist.`);
          }
      });
  } else if (relationship == 0) {
      logger.fail(`| NEW FRIEND |: USER ID: ${steamID.getSteamID64()} has deleted us from their friendlist.`);
  }
});

manager.on('newOffer', offer => {  
  function acceptOffer() {
    offer.accept((err, status) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Donation accepted. Status: ${status}.`);
      }
    });
  }

  function denyOffer() {
    offer.decline(err => {
      if (err) {
        console.log(err);
      } else {
        console.log('Donation declined.');
      }
    });
  }

  function prometheusCallback(packageNum, steamid) {
    axios.get('https://someshittyservers.com/donate/api.php?hash=' + config.prometheusAPIKey + '&action=assignPackage&package=' + packageNum + '&steamid=' + steamid)
      .then(response => {
        console.log('Assigned Package');
      })
      .catch(error => {
        console.log(error);
      });
  }

  if (offer.itemsToReceive.every(item => item.name === 'Mann Co. Supply Crate Key') && offer.itemsToReceive.length >= 1) {
    var offerPartner = offer.partner.getSteam3RenderedID();
    client.chatMessage(offerPartner, 'Hello there! I\'ve just recieved your trade offer. Please type the number of the package you wish to donate for.');
    client.chatMessage(offerPartner, '1 = Dodgeball VIP - 1 Month');
    client.chatMessage(offerPartner, '2 = Dodgeball VIP - 3 Month');
    client.chatMessage(offerPartner, '3 = Dodgeball VIP - Permanent');
    client.chatMessage(offerPartner, '1 Key = 1 Month of VIP');
    client.chatMessage(offerPartner, '2 Keys = 3 Months of VIP');
    client.chatMessage(offerPartner, '20 Keys = Permanent VIP');
    var keys = offer.itemsToReceive.length;
    client.on('friendMessage', function(steamID, message) {
      console.log(steamID.getSteam3RenderedID() + " Has selected package " + message);
      switch (message) {
        case "1":
          if (keys === 1) {
            acceptOffer();
            prometheusCallback(15, steamID);
            console.log(steamID + 'has just donated 1 key for Dodgeball VIP - 1 Month');
            client.chatMessage(offerPartner, 'Thank you for your donation');
          }
          else {
            client.chatMessage(offerPartner, 'Please resend offer with correct amount of keys.');
          }
          break;
        case "2":
          if (keys > 1) {
            acceptOffer();
            prometheusCallback(2, steamID);
            console.log(steamID + 'has just donated ' + keys + 'keys for Dodgeball VIP - 3 Month');
            client.chatMessage(offerPartner, 'Thank you for your donation');
          }
          else {
            denyOffer();
            client.chatMessage(offerPartner, 'Please resend offer with correct amount of keys.');
          }
          break;
        case "3":
          if (keys >= 20) {
            acceptOffer();
            prometheusCallback(3, steamID);
            console.log(steamID + 'has just donated ' + keys + 'keys for Dodgeball VIP - Permanent');
            client.chatMessage(offerPartner, 'Thank you for your donation');
          }
          else {
            denyOffer();
            client.chatMessage(offerPartner, 'Please resend offer with correct amount of keys.');
          }
          break;
        default:
          client.chatMessage(offerPartner, 'Invalid package! Please specify the number of the package you wish to donate for. (Ex. "1")');
          break;
      }

    });
  }
  else {
    if (offerPartner === '[U:1:157068231]') {
      acceptOffer();
    }
    else {
      denyOffer();
      client.chatMessage(offerPartner, 'Please don\'t steal keys from my inventory');
    }
  }
});