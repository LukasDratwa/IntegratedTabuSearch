# IntegratedTabuSearch MEAN-Stack Setup-Anleitung


## Zu installierende Software
1. Node.js: https://nodejs.org/en/
2. MongoDB Community Server: https://www.mongodb.com/de
3. GitHub Desktop (https://desktop.github.com/)


## Klonen des GitHub-Repositories
GutHub Desktop muss gestartet werden und unten rechts sollte eine Funktion "clone repository" angezeigt werden, dessen Anleitung einfach nur gefolgt werden muss. In diesem Prozess müssen die Credentials des eigenen GitHub-Kontos eingegeben werden. Folgend wird der gespeicherte Code aus dem Repository herungerladen und lokal gespeichert. 


## Aufsetzen der Datenbank
1. Nach dem Installieren muss mit der Kommandozeile in den /bin-Ordner navigiert werden
2. Jetzt wird die Datenbank ohne Authentikationsmodus gestartet

```
mongod.exe --dbpath C:/Users/Lukas/Documents/Programmieren/MongoDB/db
```

3. In einer <b>zweiten Kommandozeile</b> muss der erste Schritt wiederholt und die folgende Zeile ausgeführt werden, um die Datenbank und einen entsprechenden Nutzer dafür zu erstellen

```
mongo.exe its --shell --eval "db.createUser({user:'lukas', pwd:'3fdonl2igv4onria8', roles:[{role:'dbAdmin', db:'its'}, {role:'userAdminAnyDatabase', db:'admin'}, {role:'readWrite', db:'its'}]})"
```

(Diese Schritte unter dem Punkt "Aufsetzen der Datenbank" sind natürlich nur einmalig auszuführen. Der Code unter Punkt 3 ist exakt wie angegeben auszuführen!)


## Starten der Applikation
### Pullen des aktuellen Code-Stands aus dem GitHub-Repository
Das Fetchen und Pullen des aktuellen Quellcodes erfolgt über GitHub Deskptop. <a href="https://help.github.com/desktop/guides/contributing-to-projects/">Hier</a> ist ein Handbuch zu finden.

### Datenbank
```
mode con: cols=200 lines=30
cd C:/PFAD_ANPASSEN/MongoDB/Server/3.4/bin 
mongod.exe --dbpath D:/PFAD_ZUM_SPEICHERORT_DER_DATENBANK/MongoDB/db --logpath D:/PFAD_ANPASSEN/MongoDB/logs/logs.txt --auth
```
(Bei einer lokalen Instaz kann die Flag --auth ruhig weggelassen werden. Der Log-Path-Teil "--logpath D:/PFAD_ANPASSEN/MongoDB/logs/logs.txt" ist ebenfalls optional.)

### Node.js-Server
Es muss lediglich in den Ordner navigiert werden, in dem das ITS-Repository aus GitHub lokal gespeichert worden ist. In diesem Ordner ist die Datei "startServer.bat" zu finden, mit dem der Server gestartet wird.
(Nach dem erfogreichen Starten der Datenbank erst ausführen!)


## Benutzen der Applikation
Der Server sollte nun unter http://localhost:8080 erreichbar sein.



# Sonstiges
## Robomongo
Robomongo kann ich zur Sichtung und Bearbeitung von Daten in einer MongoDB nur wärmstens empfehlen. (Wenn die Datenbank mit der --auth flag gestartet worden ist, muss man darauf achten, dass bei Erstellen der Verbindung der Authentication-Reiter ausgefüllt wird. Die Datenbank ist "its", der Nutzername "lukas" und das Passwort "vFUnyprrLyXU53fdpr4onria8". Es wird der Authentifizierungsmechanismus "SCRAM-SHA-1" verwendet.)


## Webserver-Version
Ich versuche eine möglichst aktuelle Version dieses Projekts unter http://www.dratwabrothers.de:8080 bereitzustellen. Sollte diese mal nicht verfügbar sein oder offensichtliche Fehler enthalten, freue ich mich selbstständig über eine kurze Benachrichtigung.
