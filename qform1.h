#ifndef QFORM1_H
#define QFORM1_H

#include <QMainWindow>
#include <QTimer>
#include <QDateTime>
#include <QFile>
#include <QFileDialog>
#include <QtNetwork/QTcpServer>
#include <QtNetwork/QTcpSocket>
#include <QtNetwork/QHostAddress>
#include <QWidget>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>

QT_BEGIN_NAMESPACE
namespace Ui {
class QForm1;
}
QT_END_NAMESPACE

typedef struct{
    char str[128];
    float f;
    int i;
    char strFinal[8];
} _sData;

class QForm1 : public QMainWindow
{
    Q_OBJECT

public:
    QForm1(QWidget *parent = nullptr);
    ~QForm1();



private slots:
    void onQTimer1();
    void onNewConnection();
    void onClientTx();
    void onClientDisconnect();

    void on_pushButton_clicked();

    void on_pushButton_2_clicked();

    void on_pushButton_3_clicked();

    void on_pushButton_4_clicked();

    void on_pushButton_6_clicked();

private:
    Ui::QForm1 *ui;
    QTimer * QTimer1;
    QTcpServer *QTcpServer1;
    QList<QTcpSocket *>clients;

    //variables para el juego race
    QMap<QTcpSocket*, bool> playerTypes;
    QJsonObject car1Position;
    QJsonObject car2Position;
    bool firstPlayerConnected = false;
};
#endif // QFORM1_H
