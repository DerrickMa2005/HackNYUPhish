import { Text, View, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';

interface EmailPopProp {
  isVisible: boolean;
  children: React.ReactNode;
  onClose: (answer: boolean) => void;
}

const EmailPop = ({ isVisible, children, onClose }: EmailPopProp) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => void(0)}
    >
      <View style={styles.outerEmail}>
        <View style={styles.openEmail}>
          <LinearGradient colors={['#9C3F49', '#14141F']} style={styles.container}>
            <Text style={styles.emailMain}>{children}</Text>
            <View style={styles.closeRegion}>
              <TouchableOpacity onPress={() => onClose(true)}>
                <Image
                  source={require('@/assets/images/yes-button.png')}
                  style={styles.button}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onClose(false)}>
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
  info: any;
  updateScore: (input: number) => void;
  removeEmail: (index: number) => void; // Add removeEmail prop
  generated: boolean;
}

const Email = ({ index, info, updateScore, removeEmail, generated}: EmailProps) => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const onModalOpen = () => setIsModalVisible(true);

  const closeModal = (answer: boolean) => {
    if (info && answer !== (info.phish_or_not === "\"Phish\"")) {
      updateScore(parseInt(info.lives_lost_if_wrong) || 0);
    }
    removeEmail(index); // Call removeEmail to remove the email from the list
    setIsModalVisible(false);
  };

  // Safely access properties with optional chaining and default values
  const body = info?.body || "";
  const callToAction = info?.call_to_action || "";
  const content = body + callToAction;
  const topic = info?.topic || "";
  const subject = info?.subject || "";
  if (generated) {
    return (
      <TouchableOpacity onPress={onModalOpen} style={styles.emailBox}>
        <Text style={styles.emailSender}>
          {topic.length > 30 ? topic.slice(0, 30) : topic}
        </Text>
        <View style={styles.emailLine}>
          <Text style={styles.emailSubject}>{subject}</Text>
          <Text style={styles.emailBody}>
            {" - " + content.slice(0, 145).replace(/(\r\n|\n|\r)/gm, "")}
          </Text>
          <EmailPop isVisible={isModalVisible} onClose={closeModal}>
            <Text style={styles.emailMain}>{content}</Text>
          </EmailPop>
        </View>
      </TouchableOpacity>
    );
  } else {
    return (
      <View style={styles.emailBox}>
        <Text style={styles.emailSender}>
          {topic.length > 30 ? topic.slice(0, 30) : topic}
        </Text>
        <View style={styles.emailLine}>
          <Text style={styles.emailSubject}>{subject}</Text>
          <Text style={styles.emailBody}>
            {" - " + content.slice(0, 145).replace(/(\r\n|\n|\r)/gm, "")}
          </Text>
          <EmailPop isVisible={isModalVisible} onClose={closeModal}>
            <Text style={styles.emailMain}>{content}</Text>
          </EmailPop>
        </View>
      </View>
    );
  }
};

interface EmailsListProps {
  emails: any[];
  score : number;
  updateScore: (input: number) => void;
  removeEmail: (index: number) => void; // Add removeEmail prop
  endGame: (win : boolean) => void;
  generated: boolean;
}

export function EmailsList({ emails, score, updateScore, removeEmail, endGame, generated }: EmailsListProps) {
  if (emails.length === 0 || score <= 0) {
    endGame(false);
    updateScore(-(100-score));
    return (
      <View style={styles.emails}>
      </View>
    )
  } else {
    return (
      <View style={styles.emails}>
        {emails.map((email, index) => (
          <Email
            key={index}
            index={index}
            info={email}
            updateScore={updateScore}
            removeEmail={removeEmail} // Pass removeEmail to Email component
            generated = {generated}
          />
        ))}
      </View>
    );
  }
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
    flex: 0.26,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    marginLeft: 10,
    color: 'white',
  },
  emailLine: {
    flex: 0.74,
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