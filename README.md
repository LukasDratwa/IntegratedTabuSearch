# IntegratedTabuSearch MEAN-Stack Setup-Anleitung

## Zu installierende Software
1. Node.js: https://nodejs.org/en/
2. MongoDB Community Server: https://www.mongodb.com/de

## Aufsetzen der Datenbank
1. Nach dem Installieren muss mit der Kommandozeile in den /bin-Ordner navigiert werden
2. Jetzt wird die Datenbank ohne Authentikationsmodus gestartet

```
mongod.exe --dbpath C:/Users/Lukas/Documents/Programmieren/MongoDB/db
```

3. In einer zweiten Kommandozeile muss der erste Schritt wiederholt und die folgende Zeile ausgeführt werden, um die Datenbank und einen entsprechenden Nutzer dafür zu erstellen

```
mongo.exe its --shell --eval "db.createUser({user:'lukas', pwd:'3fdonl2igv4onria8', roles:[{role:'dbAdmin', db:'its'}, {role:'userAdminAnyDatabase', db:'admin'}, {role:'readWrite', db:'its'}]})"
```

## Starten der Applikation
### Datenbank
```
mode con: cols=200 lines=30
cd C:/PFAD_ANPASSEN/MongoDB/Server/3.4/bin 
mongod.exe --dbpath D:/PFAD_ZUM_SPEICHERORT_DER_DATENBANK/MongoDB/db --logpath D:/PFAD_ANPASSEN/MongoDB/logs/logs.txt --auth
```
(Bei einer lokalen Instaz kann die Flag --auth ruhig weggelassen werden.)

### Node.js-Server
Einfach den gesamten Inhalt des Repositories herunterladen und die startServer.bat-Datei ausführen.
(Nach dem erfogreichen Starten der Datenbank erst ausführen!)

## Benutzen der Applikation
Der Server sollte nun unter http://localhost:8080 erreichbar sein.


# Sonstiges

## Robomongo
Robomongo kann ich zur Sichtung und Bearbeitung von Daten in einer MongoDB nur wärmstens empfehlen. (Wenn die Datenbank mit der --auth flag gestartet worden ist, muss man darauf achten, dass bei Erstellen der Verbindung der Authentication-Reiter ausgefüllt wird. Die Datenbank ist "its", der Nutzername "lukas" und das Passwort "vFUnyprrLyXU53fdpr4onria8". Es wird der Authentifizierungsmechanismus "SCRAM-SHA-1" verwendet.)
