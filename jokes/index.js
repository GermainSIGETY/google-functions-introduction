const jokeRepository = require('./jokesRepository.js');
const express = require("express");
const functions = require('firebase-functions');

const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();

const app = express();

app.get('', (req, res) => {
    console.log(`list jokes`);
    jokeRepository.listJokes()
        .then((result) => {
            res.status(200).send(result);
        })
        .catch((err) => {
            res.status(500).send(err.message);
        });
});

app.get('/:id', (req, res) => {
    const id = req.params.id;
    jokeRepository.readJoke(id)
        .then(([entity]) => {
            // The get operation will not fail for a non-existent entity, it just
            // returns an empty dictionary.
            if (!entity) {
                throw new Error(`No joke found for id ${id}.`);
            }
            res.status(200).send(entity);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(err.message);
        });
});

app.post('', (req, res) => {
    const setup = req.body.setup;
    const punchline = req.body.punchline;

    console.log(`new joke : ${setup} : ${punchline}`);

    jokeRepository.createJoke(setup, punchline)
        .then((result) => {
            publishjokeAddedEvent(setup,punchline);
            res.status(200).send(result);

        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(err.message);
        });
});

publishjokeAddedEvent = (setup, punchline) => {
    const topicName = 'new_joke';
    const data = JSON.stringify({setup: setup, punchline: punchline});
    const dataBuffer = Buffer.from(data);
    pubsub
        .topic(topicName)
        .publisher()
        .publish(dataBuffer)
        .then(messageId => {
            console.log(`Message ${messageId} published.`);
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
};

exports.jokes = functions.https.onRequest(app);
