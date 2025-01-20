#include "qform1.h"
#include "ui_qform1.h"

QForm1::QForm1(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::QForm1)
{
    ui->setupUi(this);

    QTimer1 = new QTimer(this);
    connect(QTimer1, &QTimer::timeout, this, &QForm1::onQTimer1);

    //Configuracion server TCP
    QTcpServer1 = new QTcpServer(this);
    connect(QTcpServer1, &QTcpServer::newConnection, this, &QForm1::onNewConnection);
}

QForm1::~QForm1()
{
    delete ui;
}

//Manejamos nuevas conexiones
void QForm1::onNewConnection()
{
    QString clientStr;

    //Obtener socket del cliente
    QTcpSocket *client = QTcpServer1->nextPendingConnection();
    //Desconexion y recepcion de datos
    connect(client, &QTcpSocket::disconnected, this, &QForm1::onClientDisconnect);
    connect(client, &QTcpSocket::readyRead, this, &QForm1::onClientTx);

    //Se agrega a la lista de clientes
    clients.append(client);

    clientStr = "CONNECT: " + client->peerAddress().toString() + ":";
    clientStr = clientStr + QString().number(client->peerPort());

    // Informacion sobre el estado actual de los jugadores(para el race)
    clientStr += "\nJugadores conectados: " + QString::number(playerTypes.size());
    clientStr += "\nPrimer jugador conectado: " + QString(firstPlayerConnected ? "Sí" : "No");

    ui->plainTextEdit->appendPlainText(clientStr);
}


//Maneja comunicaciones http
void QForm1::onClientTx()
{
    QString header;
    QByteArray data;
    int count;
    QTcpSocket *client = static_cast<QTcpSocket *>(QObject::sender());
    count = client->bytesAvailable();
    if (count <= 0)
        return;

    data = client->readAll();
    ui->plainTextEdit->appendPlainText(QString(data));

    QString request = QString(data);
    QStringList requestLines = request.split("\n");
    QString requestLine = requestLines.first();
    QString method = requestLine.split(" ")[0];
    QString path = requestLine.split(" ")[1];

    ui->plainTextEdit->appendPlainText("Método: " + method + " Ruta: " + path);

    //Peticiones CORS
    if (method == "OPTIONS") {
        QString responseHeader = "HTTP/1.1 200 OK\r\n";
        responseHeader += "Access-Control-Allow-Origin: *\r\n";
        responseHeader += "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
        responseHeader += "Access-Control-Allow-Headers: Content-Type\r\n";
        responseHeader += "Content-Length: 0\r\n\r\n";

        client->write(responseHeader.toUtf8());
        return;
    }

    // logica para determinar si es primer o segundo player
    if (path == "/checkPlayer") {
        bool isFirst = !firstPlayerConnected;
        if (!firstPlayerConnected) {
            firstPlayerConnected = true;
            playerTypes[client] = true;
        } else {
            playerTypes[client] = false;
        }

        QJsonObject response;
        response["isFirstPlayer"] = isFirst;

        QJsonDocument doc(response);
        QString jsonResponse = doc.toJson();

        QString responseHeader = "HTTP/1.1 200 OK\r\n";
        responseHeader += "Content-Type: application/json\r\n";
        responseHeader += "Access-Control-Allow-Origin: *\r\n";
        responseHeader += QString("Content-Length: %1\r\n\r\n").arg(jsonResponse.length());

        client->write(responseHeader.toUtf8());
        client->write(jsonResponse.toUtf8());
        return;
    }

    if (path.contains('?')) {
        path = path.split('?').first();
    }

    QFile file;
    QString contentType;
    QString basePath = qApp->applicationDirPath() + "/finalhachmann";

    //Manejo de archivos estaticos desde el directorio (/finalhachmann)

    while (path.contains("//")) {
        path.replace("//", "/");
    }

    if (path.endsWith(".html")) {
        contentType = "text/html";
    } else if (path.endsWith(".css")) {
        contentType = "text/css";
    } else if (path.endsWith(".js")) {
        contentType = "application/javascript";
    } else if (path.endsWith(".png")) {
        contentType = "image/png";
    } else if (path.endsWith(".svg")) {
        contentType = "image/svg+xml";
    } else if (path.endsWith(".json")) {
        contentType = "application/json";
    } else {
        contentType = "text/plain";
    }

    //Endpoint para obtener las posiciones (autos del race)
    if (method == "GET") {
        if (path == "/getPositions") {
            //Envia posicion de los autos en json
            QJsonObject response;
            response["car1Position"] = car1Position;
            response["car2Position"] = car2Position;

            QJsonDocument doc(response);
            QString jsonResponse = doc.toJson();

            QString responseHeader = "HTTP/1.1 200 OK\r\n";
            responseHeader += "Content-Type: application/json\r\n";
            responseHeader += "Access-Control-Allow-Origin: *\r\n";
            responseHeader += QString("Content-Length: %1\r\n\r\n").arg(jsonResponse.length());

            client->write(responseHeader.toUtf8());
            client->write(jsonResponse.toUtf8());
            return;
        }
        else if (path == "/") {
            file.setFileName(basePath + "/index.html");
            contentType = "text/html";
        } else {
            QString fullPath = basePath + path;
            file.setFileName(fullPath);
        }

        if (!file.exists()) {
            QString notFoundResponse = "HTTP/1.1 404 Not Found\r\nContent-Type: text/html\r\n\r\n"
                                       "<html><body><h1>404 - File Not Found</h1></body></html>";
            client->write(notFoundResponse.toUtf8());
            return;
        }

        if (file.open(QFile::ReadOnly)) {
            header = QString("HTTP/1.1 200 OK\r\n");
            header += QString("Content-Type: %1\r\n").arg(contentType);
            header += "Access-Control-Allow-Origin: *\r\n";
            header += QString("Content-Length: %1\r\n\r\n").arg(file.size());
            client->write(header.toUtf8());
            client->write(file.readAll());
            file.close();
        } else {
            QString errorResponse = "HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/html\r\n\r\n"
                                    "<html><body><h1>500 - Internal Server Error</h1></body></html>";
            client->write(errorResponse.toUtf8());
        }
    }

    //Peticiones POST
    else if (method == "POST") {
        // Extraer el cuerpo del POST request
        QString body;
        bool foundEmptyLine = false;
        for(const QString& line : requestLines) {
            if (line.trimmed().isEmpty()) {
                foundEmptyLine = true;
                continue;
            }
            if (foundEmptyLine) {
                body = line;
                break;
            }
        }

        //posición de los autos cuando los jugadores se mueven
        if (path == "/updatePosition") {

            QJsonDocument jsonDoc = QJsonDocument::fromJson(body.toUtf8());
            QJsonObject jsonObj = jsonDoc.object();

            if (jsonObj["isFirstPlayer"].toBool()) {
                car1Position = jsonObj["position"].toObject();
            } else {
                car2Position = jsonObj["position"].toObject();
            }

            QString jsonResponse = "{\"status\": \"ok\"}";
            QString responseHeader = "HTTP/1.1 200 OK\r\n";
            responseHeader += "Content-Type: application/json\r\n";
            responseHeader += "Access-Control-Allow-Origin: *\r\n";
            responseHeader += QString("Content-Length: %1\r\n\r\n").arg(jsonResponse.length());

            client->write(responseHeader.toUtf8());
            client->write(jsonResponse.toUtf8());
        }
        else {
            QString errorResponse = "HTTP/1.1 404 Not Found\r\nContent-Type: text/html\r\n\r\n"
                                    "<html><body><h1>404 - Endpoint Not Found</h1></body></html>";
            client->write(errorResponse.toUtf8());
        }
    }
    else {
        QString errorResponse = "HTTP/1.1 405 Method Not Allowed\r\nContent-Type: text/html\r\n\r\n"
                                "<html><body><h1>405 - Method Not Allowed</h1></body></html>";
        client->write(errorResponse.toUtf8());
    }
}


//Maneja desconexion de clientes
void QForm1::onClientDisconnect()
{
    int i;
    QString clientStr;

    QTcpSocket *client = static_cast<QTcpSocket *>(QObject::sender());

    // Manejar la desconexión del jugador
    if (playerTypes.contains(client)) {
        if (playerTypes[client]) {
            firstPlayerConnected = false; // Liberar slot
            ui->plainTextEdit->appendPlainText("Primer jugador desconectado");
        } else {
            ui->plainTextEdit->appendPlainText("Segundo jugador desconectado");
        }
        playerTypes.remove(client); //Elimina registro
    }

    clientStr = "DISCONNECT: " + client->peerAddress().toString() + ":";
    clientStr = clientStr + QString().number(client->peerPort());


    //Limpieza
    i = clients.indexOf(client);
    if(i != -1)
        clients.takeAt(i);
    i = QTcpServer1->children().indexOf(client);
    if(i >= 1)
        QTcpServer1->children().at(i)->deleteLater();

    ui->plainTextEdit->appendPlainText(clientStr);
}

void QForm1::onQTimer1()
{
    QString strDate;

    strDate = QDateTime().currentDateTime().toString("hh:mm:ss - dd/MM/yyyy");
    ui->statusbar->showMessage(strDate);
}

void QForm1::on_pushButton_clicked()
{
    char opr[64];
    float opd[64];
    int i, iOpd, iOpr, iSubString;
    QString expression, strError, str;
    bool ok;

    if(ui->lineEdit->text() == "")
        return;

    expression = ui->lineEdit->text();
    ui->plainTextEdit->appendPlainText(expression);
    expression = expression.remove(" ");
    ui->plainTextEdit->appendPlainText(expression);



    for(i=0, iOpd=0, iOpr=0, iSubString=0; i<expression.size();  i++){
        if(((expression.at(i)=='+' || expression.at(i)=='-') && i!=0) ||
            expression.at(i)=='*' || expression.at(i)=='/'){
            opr[iOpr++] = expression.at(i).toLatin1();
            opd[iOpd++] = expression.mid(iSubString, i-iSubString).toFloat(&ok);
            if(!ok){
                strError = QString().asprintf("ERROR c:%d - %s", iSubString, expression.mid(iSubString, i-iSubString).toUtf8().data());
                ui->plainTextEdit->appendPlainText(strError);
                return;
            }
            iSubString = i+1;
        }
    }
    opd[iOpd++] = expression.mid(iSubString, i-iSubString).toFloat(&ok);
    if(!ok){
        strError = QString().asprintf("ERROR c:%d - %s", iSubString, expression.mid(iSubString, i-iSubString).toUtf8().data());
        ui->plainTextEdit->appendPlainText(strError);
        return;
    }

    i=0;
    while (i<iOpr) {
        if(opr[i]=='*' || opr[i]=='/'){
            if(opr[i]=='*')
                opd[i] *= opd[i+1];
            else
                opd[i] /= opd[i+1];

            for(int j=i+1; j<iOpr; j++)
                opr[j-1] = opr[j];
            iOpr--;

            for(int j=i+1; j<iOpd; j++)
                opd[j] = opd[j+1];
            iOpd--;

            i--;
        }
        i++;
    }



    ui->plainTextEdit->appendPlainText("* y /");
    for(i=0; i<iOpr; i++){
        str = QString().asprintf("%10.2f\t\t%c", opd[i], opr[i]);
        ui->plainTextEdit->appendPlainText(str);
    }
    str = QString().asprintf("%10.2f", opd[i]);
    ui->plainTextEdit->appendPlainText(str);


    i=0;
    while (i<iOpr) {
        if(opr[i]=='+' || opr[i]=='-'){
            if(opr[i]=='+')
                opd[i] += opd[i+1];
            else
                opd[i] -= opd[i+1];

            for(int j=i+1; j<iOpr; j++)
                opr[j-1] = opr[j];
            iOpr--;

            for(int j=i+1; j<iOpd; j++)
                opd[j] = opd[j+1];
            iOpd--;

            i--;
        }
        i++;
    }



    ui->plainTextEdit->appendPlainText("+ y -");
    for(i=0; i<iOpr; i++){
        str = QString().asprintf("%10.2f\t\t%c", opd[i], opr[i]);
        ui->plainTextEdit->appendPlainText(str);
    }
    str = QString().asprintf("%10.2f", opd[i]);
    ui->plainTextEdit->appendPlainText(str);
}



void QForm1::on_pushButton_2_clicked()
{
    if(QTimer1->isActive()){
        QTimer1->stop();
        ui->statusbar->showMessage("");
        ui->pushButton_2->setText("START DateTime");
    }
    else{
        QTimer1->start(500);
    ui->pushButton_2->setText("STOP DateTime");
        }
}


void QForm1::on_pushButton_3_clicked()
{
    QFile testFile;
    QString strAux;
    _sData aux;
    static int count = 1000;

    if(ui->lineEdit->text() == "")
        return;

    strcpy(aux.str, ui->lineEdit->text().toUtf8().data());
    aux.f = 10.5;
    aux.i = count++;
    strcpy(aux.strFinal, "FINAL");

    testFile.setFileName("D:/txtBin.dat");

    if(testFile.open(QFile::WriteOnly | QFile::Append)){
        testFile.write((char *)&aux, sizeof(_sData));
    }
    else
        return;

    testFile.close();


}


void QForm1::on_pushButton_4_clicked()
{
    QFile testFile;
    //QString strAux;
    ///char strAux[64];
    ///QByteArray aux;

    _sData aux;


    testFile.setFileName("D:/txtBin.dat");

    if(testFile.open(QFile::ReadOnly)){

        ///testFile.seek(0);
        ///testFile.readLine(strAux, 64);
        ///ui->plainTextEdit->appendPlainText(strAux);
        ///while (testFile.readLine(strAux.toUtf8().data(), 64)) {
        ///    ui->plainTextEdit->appendPlainText(strAux);
        testFile.seek(0);
        while (testFile.read((char *)&aux, sizeof(_sData)))
            ui->plainTextEdit->appendPlainText(QString().number(aux.i));

    }
    else
        return;

    testFile.close();
}


void QForm1::on_pushButton_6_clicked()
{
    quint16 port;
    bool ok;

    if(QTcpServer1->isListening()){
        while (clients.count())
            clients.at(0)->close();

        QTcpServer1->close();
        ui->pushButton_6->setText("OPEN");
    }
    else{
        port = ui->lineEdit_2->text().toUShort(&ok);
        if(ok){
            if(QTcpServer1->listen(QHostAddress::Any, port)){
                ui->pushButton_6->setText("CLOSE");
            }
        }
    }
}

