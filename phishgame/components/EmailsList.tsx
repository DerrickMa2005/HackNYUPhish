import { Text, View, StyleSheet, Modal,  TouchableOpacity, Pressable} from 'react-native';
import React from 'react';
import { useState } from 'react';

interface EmailPopProp {
    isVisible: boolean;
    children: React.ReactNode;
    onClose: () => void;
}

const EmailPop = ({isVisible, children, onClose} : EmailPopProp) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style = {styles.container}>
                <View style={styles.closeRegion}>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            X</Pressable>
                    </View>
                    <text style={styles.emailMain}>{children}</text>
            </View>
        </Modal>
    );
}

interface EmailProps {
    index: number;
    send : string;
    subject : string;
    content : string;
}

const Email = ({index, send, subject, content} : EmailProps) => {
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const onModalOpen = () => {
        setIsModalVisible(true);
    } 
    const closeModal = () => {
        setIsModalVisible(false);
    }
    return (
        <TouchableOpacity
                onPress={onModalOpen} style={styles.emailBox}>
            <Text style={styles.emailSender}>{send.length > 15 ? send.slice(0, 15) : send}</Text>
            <View style={styles.emailLine}>
                <Text style={styles.emailSubject}>{subject}</Text>
                <Text style={styles.emailBody}>{" - " + content.slice(0, 125).replace(/(\r\n|\n|\r)/gm, "")}</Text>
                <EmailPop isVisible={isModalVisible} onClose={closeModal}>
                    <Text>{content}</Text>
                </EmailPop>
            </View>
        </TouchableOpacity>
        
    );
}

interface EmailsListProps {
    emails : JSON;
}
export function EmailsList({emails} : EmailsListProps) {
    const emailList = new Array(10);
    for (let i = 0; i < 10; i++) {
        emailList[i] = emails.body[i];
    }
    return (
        <View style={styles.emails}>
            {emailList.map((email, index) => (
                <Email key={index} index={index} send={email.topic} subject={email.topic} 
                content={email.body + email.call_to_action}/>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    emailMain: {
        flex: 0.87,
    },
    emailSender: {
        flex: 0.13,
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
        marginLeft: 10,
    },
    emailLine: {
        flex: 0.87,
        flexDirection: 'row',
        alignItems: 'center',
    },
    emailSubject: {
        fontSize: 12,
    },
    emailBody: {
        fontSize: 10,
        color: 'grey',
    },
    emails: {
        flex: 1,
        flexDirection: 'column',
    },
    emailBox: {
        flex: 0.1,
        borderBottomWidth: 1,
        borderColor: 'black',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'grey',
    },
    closeRegion: {
        flex: 0.1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    closeButton: {
        fontSize: 20,
        fontWeight: 'bold',
        backgroundColor: 'white',
        borderWidth: 2,
        borderRadius: 10,
        width: 40,
        height: 40,
        textAlign: 'center',
        margin: 10,
    }
});