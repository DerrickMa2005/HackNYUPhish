import { Text, View, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface EmailPopProp {
    isVisible: boolean;
    children: React.ReactNode;
    onClose: () => void;
}

const EmailPop = ({ isVisible, children, onClose }: EmailPopProp) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.outerEmail}>
                <View style={styles.openEmail}>
                    <LinearGradient
                        colors={['#9C3F49', '#14141F']}
                        style={styles.container}
                    >
                        <Text style={styles.emailMain}>{children}</Text>
                        <View style={styles.closeRegion}>
                            <TouchableOpacity onPress={onClose}>
                                <Image
                                    source={require('@/assets/images/yes-button.png')}
                                    style={styles.button}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <Image
                                    source={require('@/assets/images/no-button.png')}
                                    style={styles.button}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

interface EmailProps {
    index: number;
    info : JSON;
    updateScore: (input : number) => void;
}

const Email = ({index, info, updateScore} : EmailProps) => {
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const onModalOpen = () => {
        setIsModalVisible(true);
    } 
    const closeModal = () => {
        setIsModalVisible(false);
    }
    const content = info.body + info.call_to_action;
    return (
        <TouchableOpacity
                onPress={onModalOpen} style={styles.emailBox}>
            <Text style={styles.emailSender}>{info.topic.length > 15 ? info.topic.slice(0, 15) : info.topic}</Text>
            <View style={styles.emailLine}>
                <Text style={styles.emailSubject}>{info.subject}</Text>
                <Text style={styles.emailBody}>{" - " + content.slice(0, 160).replace(/(\r\n|\n|\r)/gm, "")}</Text>
                <EmailPop isVisible={isModalVisible} onClose={closeModal}>
                    <Text style={styles.openEmail}>{content}</Text>
                </EmailPop>
            </View>
        </TouchableOpacity>
        
    );
}

interface EmailsListProps {
    emails : JSON;
    updateScore: (input : number) => void;
}
export function EmailsList({emails, updateScore} : EmailsListProps) {
    const emailList = new Array(10);
    for (let i = 0; i < 10; i++) {
        emailList[i] = emails.body[i];
    }
    return (
        <View style={styles.emails}>
            {emailList.map((email, index) => (
                <Email key={index} index={index} info = {email} updateScore={updateScore}/>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        marginTop: 250,
        height: 400,
        width: 400,
    },
    outerEmail: {
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    openEmail: {
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emailMain: {
        flex: 0.2,
        flexDirection: 'column',
        height: 500,
        color: 'white',
    },
    emailSender: {
        flex: 0.13,
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
        marginLeft: 10,
        color: 'white',
    },
    emailLine: {
        flex: 0.87,
        flexDirection: 'row',
        alignItems: 'center',
    },
    emailSubject: {
        fontSize: 12,
        color: 'white',
    },
    emailBody: {
        fontSize: 10,
        color: 'white',
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
        width: '80%',
        borderColor: 'black',
        borderRadius: 10,
        borderWidth: 5,
    },
    closeRegion: {
        flex: 0.1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        margin: 20,
    },
    yesButton: {
        fontSize: 20,
        fontWeight: 'bold',
        backgroundColor: 'green',
        borderWidth: 2,
        borderRadius: 10,
        borderColor: 'black',
        width: 150,
        height: 50,
        textAlign: 'center',
        margin: 10,
    },
    noButton: {
        fontSize: 20,
        fontWeight: 'bold',
        backgroundColor: 'red',
        borderWidth: 2,
        borderRadius: 10,
        width: 150,
        height: 50,
        textAlign: 'center',
        margin: 10,
        borderColor: 'black',
    },
});