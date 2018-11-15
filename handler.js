const util = require('util');
var imaps = require('imap-simple');
var email = require('mailparser');
var request = require('request');
var imapconnection = {};

//trello variables, please insert your variables
var trello_key = 'xxxx'; //your trello API key
var trello_token = 'xxxx'; //your trello API token
var trello_list_id = 'xxxx'; //your trello default list where cards will be inserted

var config = {
    imap: {
        user: '', //your imap user
        password: '', //your imap password
        host: '', //imap host
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false
        },
        authTimeout: 3000
    }
};

imaps.connect(config).then(function (connection) {
    imapconnection = connection;
    setInterval(controlla, 30000);
});

//controlla
//scheduled function, checking for unread ticket emails
function controlla() {
    console.log('check..');

    imapconnection.openBox('Inbox').then(function () {
        var searchCriteria = [
            'UNSEEN',
            ['HEADER', 'SUBJECT', '#TSE']
        ];

        var fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false
        };

        return imapconnection.search(searchCriteria, fetchOptions).then(function (results) {
            var subjects = results.map(function (res) {
                return res.parts.filter(function (part) {
                    return part.which === 'HEADER';
                })[0].body.subject[0];
            });

            if (results.length > 0) {
                //insert multiple unread ticket emails
                for (var y = 0; y < results.length; y++) {

                    var content = results[y];
                    var numeroTicket = parseNumeroTicket(content.parts[0].body.subject[0]);
                    console.log('ticket', numeroTicket);
                    controllaTicketEsistente(content, numeroTicket, function (trovato, content, numeroTicket) {
                        try {
                            if (!trovato) {
                                console.log('ticket not found', numeroTicket);

                                email.simpleParser(content.parts[1].body, function (err, mail) {
                                    if (err) {
                                        console.error(err);
                                    } else {
                                        console.log(mail.text);
                                        createCard(numeroTicket, mail.body);
                                    }
                                });

                            } else {
                                console.log('ticket exists!');

                            }
                        } catch (ex) {
                            console.error(ex);
                        }
                    });
                }
            }
        });
    });
}

//controllaTicketEsistente
//check if card exists, return callback with first argument true if found, otherwise false
function controllaTicketEsistente(content, ticket, callback) {
    var ticketsAddr = 'https://api.trello.com/1/lists/' + trello_list_id + '/cards?key=' + trello_key + '&token=' + trello_token;
    request(ticketsAddr, function (error, response, body) {
        if (error) console.error(error);
        else {
            body = JSON.parse(body);
            var trovato = false;
            for (var x = 0; x < body.length; x++) {
                var card = body[x];
                console.log('card name', card.name);
                if (card.name.indexOf(ticket) > -1) {
                    trovato = true;
                    break;
                }
            }
            callback(trovato, content, ticket);
        }
    });
}

//createCard
//create card on trello into the specified list
function createCard(ticketNumber, ticketBody) {
    var creaCard = {
        method: 'POST',
        url: 'https://api.trello.com/1/cards?key=' + trello_key + '&token=' + trello_token,
        qs: {
            idList: trello_list_id,
            name: ticketNumber,
            desc: ticketBody
        }
    };

    request(creaCard, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
    });
}

//parseNumeroTicket
//parse email subject extracting only the ticket number
//example: [WEBAPP] #TSE0001002 - application crash
//return: #TSE0001002
function parseNumeroTicket(subject) {
    var ticketRegex = /#TSE([0-9]+)/g;
    var res = ticketRegex.exec(subject);
    if (res.length > 0)
        return res[0];
    return subject;
}

//getDescrizione
//return text of email after the 'Messaggio:' string (you can change)
function getDescrizione(body) {
    console.log('getDescrizione', body);
    var ricerca = 'Messaggio:&lt;';
    var idx = body.indexOf(ricerca);
    if (idx > -1) {
        body = body.substring((idx + ricerca.length));
    }
    return body;
}