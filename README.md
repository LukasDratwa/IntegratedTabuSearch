# IntegratedTabuSearch MEAN-Stack Setup-Anleitung

## Zu installierende Software
1. Node.js: https://nodejs.org/en/
2. MongoDB Community Server: https://www.mongodb.com/de

## Aufsetzen der Datenbank
1. Nach dem Installieren muss mit der Kommandozeile in den /bin-Ordner navigiert werden
2. Nun muss folgende Zeile ausgeführt werden, um die Datenbank und einen entsprechenden Nutzer dafür zu erstellen

```json
mongo.exe folivora --shell --eval "db.createUser({user:'folivora', pwd:'3fdonl2igv4onria8', roles:[{role:'dbAdmin', db:'folviora'}, {role:'userAdminAnyDatabase', db:'admin'}, {role:'readWrite', db:'folivora'}]})"
```

## Starten der Applikation
### Datenbank
```
mode con: cols=200 lines=30
cd C:/PFAD_ANPASSEN/MongoDB/Server/3.4/bin 
mongod.exe --dbpath D:/PFAD_ZUM_SPEICHERORT_DER_DATENBANK/MongoDB/db --logpath D:/PFAD_ANPASSEN/MongoDB/logs/logs.txt --auth
```

### Node.js-Server
Einfach den gesamten Inhalt des Repositories herunterladen und die startServer.bat-Datei ausführen.
(Nach dem erfogreichen Starten der Datenbank erst ausführen!)

## Benutzen der Applikation
Der Server sollte nun unter http://localhost:8080 erreichbar sein.
