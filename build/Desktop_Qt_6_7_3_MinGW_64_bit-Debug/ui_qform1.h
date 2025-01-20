/********************************************************************************
** Form generated from reading UI file 'qform1.ui'
**
** Created by: Qt User Interface Compiler version 6.7.3
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_QFORM1_H
#define UI_QFORM1_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QMenuBar>
#include <QtWidgets/QPlainTextEdit>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QStatusBar>
#include <QtWidgets/QWidget>

QT_BEGIN_NAMESPACE

class Ui_QForm1
{
public:
    QWidget *centralwidget;
    QPushButton *pushButton;
    QLineEdit *lineEdit;
    QPushButton *pushButton_2;
    QPlainTextEdit *plainTextEdit;
    QPushButton *pushButton_3;
    QPushButton *pushButton_4;
    QPushButton *pushButton_6;
    QLineEdit *lineEdit_2;
    QMenuBar *menubar;
    QStatusBar *statusbar;

    void setupUi(QMainWindow *QForm1)
    {
        if (QForm1->objectName().isEmpty())
            QForm1->setObjectName("QForm1");
        QForm1->resize(800, 600);
        centralwidget = new QWidget(QForm1);
        centralwidget->setObjectName("centralwidget");
        pushButton = new QPushButton(centralwidget);
        pushButton->setObjectName("pushButton");
        pushButton->setGeometry(QRect(550, 40, 131, 31));
        QFont font;
        font.setPointSize(12);
        pushButton->setFont(font);
        lineEdit = new QLineEdit(centralwidget);
        lineEdit->setObjectName("lineEdit");
        lineEdit->setGeometry(QRect(170, 40, 371, 31));
        lineEdit->setFont(font);
        lineEdit->setFrame(false);
        pushButton_2 = new QPushButton(centralwidget);
        pushButton_2->setObjectName("pushButton_2");
        pushButton_2->setGeometry(QRect(550, 80, 131, 31));
        pushButton_2->setFont(font);
        plainTextEdit = new QPlainTextEdit(centralwidget);
        plainTextEdit->setObjectName("plainTextEdit");
        plainTextEdit->setGeometry(QRect(170, 70, 371, 331));
        pushButton_3 = new QPushButton(centralwidget);
        pushButton_3->setObjectName("pushButton_3");
        pushButton_3->setGeometry(QRect(550, 120, 131, 31));
        pushButton_3->setFont(font);
        pushButton_4 = new QPushButton(centralwidget);
        pushButton_4->setObjectName("pushButton_4");
        pushButton_4->setGeometry(QRect(550, 160, 131, 31));
        pushButton_4->setFont(font);
        pushButton_6 = new QPushButton(centralwidget);
        pushButton_6->setObjectName("pushButton_6");
        pushButton_6->setGeometry(QRect(550, 240, 131, 31));
        pushButton_6->setFont(font);
        lineEdit_2 = new QLineEdit(centralwidget);
        lineEdit_2->setObjectName("lineEdit_2");
        lineEdit_2->setGeometry(QRect(550, 200, 131, 31));
        lineEdit_2->setFont(font);
        lineEdit_2->setAlignment(Qt::AlignmentFlag::AlignCenter);
        QForm1->setCentralWidget(centralwidget);
        menubar = new QMenuBar(QForm1);
        menubar->setObjectName("menubar");
        menubar->setGeometry(QRect(0, 0, 800, 21));
        QForm1->setMenuBar(menubar);
        statusbar = new QStatusBar(QForm1);
        statusbar->setObjectName("statusbar");
        QForm1->setStatusBar(statusbar);

        retranslateUi(QForm1);

        QMetaObject::connectSlotsByName(QForm1);
    } // setupUi

    void retranslateUi(QMainWindow *QForm1)
    {
        QForm1->setWindowTitle(QCoreApplication::translate("QForm1", "QForm1", nullptr));
        pushButton->setText(QCoreApplication::translate("QForm1", "CALCULAR", nullptr));
        lineEdit->setPlaceholderText(QCoreApplication::translate("QForm1", "Ingrese expresion", nullptr));
        pushButton_2->setText(QCoreApplication::translate("QForm1", "START DateTimer", nullptr));
        pushButton_3->setText(QCoreApplication::translate("QForm1", "OPEN File to SAVE", nullptr));
        pushButton_4->setText(QCoreApplication::translate("QForm1", "OPEN File to READ", nullptr));
        pushButton_6->setText(QCoreApplication::translate("QForm1", "OPEN", nullptr));
        lineEdit_2->setPlaceholderText(QCoreApplication::translate("QForm1", "SERVER PORT", nullptr));
    } // retranslateUi

};

namespace Ui {
    class QForm1: public Ui_QForm1 {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_QFORM1_H
