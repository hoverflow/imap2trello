# imap2trello
Create cards on trello based on tickets received from email.

this is a simple application that polls imap for new email tickets every 30seconds.
if there is a new emails that contains the subject starting with "#TSE" the application will check trello if exists a card with that number. if card not exists will be created.
the email body will be parsed and inserted as trello card description.

you can run as a docker container:
- docker build -t imap2trello .
- docker run -d --name imap2trello -it imap2trello

or as a node.js application:
- npm install
- npm start

Note: OsTicket emails contains ticket number into subject, example: "#TSE00001002 webapplication crash"
You can modify the application logic to fit your system if the email subject of your ticketing system use different ticket subject.


