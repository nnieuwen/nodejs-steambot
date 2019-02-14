var interact = function() {
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
}

module.exports = interact;