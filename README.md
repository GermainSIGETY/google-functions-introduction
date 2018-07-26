# Google Functions Introduction

## TL;DR

A step by step tutorial on Google functions, in order to deploy an HTTP Rest endpoint for jokes,
 and sending emails with jokes.

## Topics covered

- Google functions with HTTP : Rest enpoint example
- Google functions triggered  by event : pub/sub
- Google Cloud cloud Datastore
- Google functions and emails

## Objectives
- create an Hello World Google function, tiggered by http
- create an HTTP Rest Endpoint for Jokes
- sending an email each time a joke is created

A tiny NodeJS background may be required :+1: 

See Medium article 

Let's go (Npm have to be installed on your machine) !

## 0 - Google accounts and SDKs

### Create GCP project

Create a project named 'jokes'

See:
https://console.cloud.google.com/cloud-resource-manager

### Enable billing for your project

See:
https://cloud.google.com/billing/docs/how-to/modify-project

### Install SDK

See:
https://cloud.google.com/sdk/docs/

## 1 - Hello world

### Create a directory for whole project

```
mkdir google-functions-introduction
```

### Create a directory for your helloWorld function

Inside 'google-functions-introduction' directory :

```
mkdir helloWorld && cd helloWorld
```

### Init NodeJs project 

```
npm init -y
npm install --save express
```

### Function's code : (index.js)

Create an index.js file with content :

```javascript
/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.helloWorld = (req, res) => {
    res.send(`Hello mon petit ${req.query.name || 'World'} !`);
};
```

### Deploy

Throw your function to Google with command :

```
gcloud beta functions deploy helloWorld --trigger-http
```

This command display in return Http URL of your google function.

### check deployment on Google Console

https://console.cloud.google.com/functions/list

(Choose corresponding project in IHM)

### test it

Copy paste URL return by gcloud console, for instance 

https://us-central2-jokes-xxxxxx.cloudfunctions.net/helloWorld?name=Louis+de+funes

(replace with your real URL buddy)

Come, you're Live now !

## 2 - HTTP Rest endpoint for Jokes

### Init npm stuff for your new function

Inside 'google-functions-introduction' directory :

```
mkdir jokes && cd jokes
npm init -y
npm install --save express
```

### Add Google cloud Datastore dependency

```
npm install --save @google-cloud/datastore
```

### Repository code for your jokes on Google Cloud Datastore

A joke is made of two parts :
-the setup
-the punchline

Create a file *jokesRepository.js* with content

```javascript
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
            puncline: punchline
        }
    };
    return datastore.save(joke);
};
```

### HTTP Rest endpoint

We will need google-function to export properly our
NodeJS express endpoint

```
npm install --save firebase-functions
npm install --save firebase-admin
```

Create an index.js file with content :

```javascript
const jokeRepository = require('./jokesRepository.js');
const express = require("express");
const functions = require('firebase-functions');

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
            res.status(200).send(result);

        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(err.message);
        });
});

exports.jokes = functions.https.onRequest(app);
```

### Deploy 

```
gcloud beta functions deploy jokes --trigger-http
```

### Test

Post a joke:

```
curl -H "Content-Type: application/json" -X POST -d \
'{"setup":"Bobby, do you think I am a bad father?","punchline":"My name is Paul."}' \
https://us-central2-jokes-xxxxxx.cloudfunctions.net/jokes/
```

List jokes: 

```
curl -X GET https://us-central2-jokes-xxxxxx.cloudfunctions.net/jokes/
``` 

Get a joke by Id:
```
curl -X GET https://us-central2-jokes-xxxxxx.cloudfunctions.net/jokes/<joke_id>
```
### Cloud Datastore

You can see your jokes documents in Google Cloud Datastore console

Open your Cloud Datastore Console and select your 'jokes' project :
https://console.cloud.google.com/datastore/

Yippe, if you're the new Jimmy Kimmel, you can store petabytes of jokes per second thanks
to your Google Serverless functions.

## 3 - Send An email on each new joke

This example illustrates background functions. Each time a new joke is posted, an event is created
and a brackground function reacts to this event and send an email.

### install Google pubsub node module
In jokes directory :

```
npm install --save @google-cloud/pubsub
``` 

### Sending the event

Modify your Joke HTTP function, in order to send event. Add this js code:

```javascript
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
    const data = JSON.stringify({lancement: setup, chute: punchline});
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
```

See new publishjokeAddedEvent JS function, and pubsub object.
Deploy it

### Create background function that subscribes to 'new_joke' event

...and send the email

#### new function

Inside 'google-functions-introduction' directory :
```
mkdir emailSub && cd emailSub
npm init -y
npm install --save nodemailer
```

index.js file:   
```javascript
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'superSender@gmail.com',
        pass: 'changeMe'
    }
});

exports.emailSub = (event, callback) => {

    const message = event.data;
    const eventRawData = Buffer.from(message.data, 'base64').toString();
    const publishedMessage = JSON.parse(eventRawData);
    const setup = publishedMessage.setup;
    const punchline = publishedMessage.punchline;

    const mailOptions = {
        from: 'sender@email.com', // sender address
        to: 'bestBoo@gmail.com', // list of receivers
        subject: 'hey listen', // Subject line
        html: `${setup} :</p><p>${punchline}</p>`// plain text body
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if (err)
            console.log(err)
        else
            console.log(info);
    });

    callback();
};
```

#### Deploy

```
gcloud beta functions deploy emailSub \
--trigger-resource new_joke \
--trigger-event google.pubsub.topic.publish
```
Notice that trigger event is no more a trigger event, but a pubsub topic.

## Done

Congrat's you exposed world's badass-est Rest API. You can perform CRUD you Google HTTP function,
use Google Cloud Datastore for storage. You control power of background functions, to implements simple and efficient
events and simple function that react to events. Superhero, I would like to be your boss.
