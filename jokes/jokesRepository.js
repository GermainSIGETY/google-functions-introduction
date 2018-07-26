'use strict';

const Datastore = require('@google-cloud/datastore');
const datastore = Datastore();

exports.listJokes = () => {
    const query = datastore.createQuery('joke');
    return datastore.runQuery(query);
};

exports.readJoke = (id) => {
    const key = datastore.key(['joke', parseInt(id)]);
    return datastore.get(key);
};

exports.createJoke = (setup, punchline) => {
    const joke = {
        key: {
            kind: "joke"
        },
        data: {
            setup: setup,
            punchline: punchline
        }
    };
    return datastore.save(joke);
};