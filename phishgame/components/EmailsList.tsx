import { Text, View, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';

interface CorrectionPopProp {
  isVisible: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

const CorrectionPop = ({ isVisible, children, onClose }: CorrectionPopProp) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => onClose()}
    >
      <View style={styles.outerEmail}>
        <View style={styles.openEmail}>
          <LinearGradient colors={['#9C3F49', '#14141F']} style={styles.container}>
            <Text style={styles.emailMain}>{children}</Text>
            <View style={styles.closeRegion}>
              <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Click here to close this window.</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

interface EmailPopProp {
  isVisible: boolean;
  children: React.ReactNode;
  onClose: (answer: boolean) => void;
}

const EmailPop = ({ isVisible, children, onClose }: EmailPopProp) => {
  const [fontsLoaded] = useFonts({
    'custom-font': require('@/assets/fonts/Game-Of-Squids.otf'),
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => void(0)}
    >
      <View style={styles.outerEmail}>
        <View style={styles.openEmail}>
          <LinearGradient colors={['#34495E', '#2C3E50']} style={styles.container}>
            <Text style={[styles.emailMain, { fontFamily: 'Georgia' }]}>{children}</Text>
            <View style={styles.closeRegion}>
              <TouchableOpacity onPress={() => onClose(true)}>
                <Image
                  source={require('@/assets/images/yes-button.png')}
                  style={styles.button}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onClose(false)}>
                <Image
                  source={require('@/assets/images/no-button.png')}
                  style={styles.button}
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

const Email = ({ index, info, updateScore, removeEmail, generated }: EmailProps) => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isExplainVisible, setIsExplainVisible] = useState<boolean>(false);

  const onModalOpen = () => setIsModalVisible(true);

  const closeModal = (answer: boolean) => {
    removeEmail(index); // Call removeEmail to remove the email from the list
    setIsModalVisible(false);
    if (info && answer !== (info.phish_or_not === "\"Phish\"")) {
      updateScore(parseInt(info.lives_lost_if_wrong) || 0);
      setIsExplainVisible(true);
    }
  };

  const closeExplain = () => setTimeout(() => setIsExplainVisible(false), 1);

  // Safely access properties with optional chaining and default values
  const body = info?.body || "";
  const callToAction = info?.call_to_action || "";
  const content = body + callToAction;
  const topic = info?.topic || "";
  const subject = info?.subject || "";
  const explanation = info?.explanation_if_wrong || "";
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
          <EmailPop isVisible={isModalVisible && !isExplainVisible} onClose={closeModal}>
            <Text style={styles.emailMain}>{content}</Text>
          </EmailPop>
          <CorrectionPop isVisible={isExplainVisible} onClose={closeExplain}>
            <Text style={styles.emailMain}>{explanation}</Text>
            </CorrectionPop>
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
            <Text style={styles.emailMain}>{content.replace(/\\n/g, '\n')}</Text>
          </EmailPop>
        </View>
      </View>
    );
  }
};

interface EmailsListProps {
  emails: any[];
  score: number;
  updateScore: (input: number) => void;
  removeEmail: (index: number) => void; // Add removeEmail prop
  endGame: (win: boolean) => void;
  generated: boolean;
}

export function EmailsList({ emails, score, updateScore, removeEmail, endGame, generated }: EmailsListProps) {
  if (emails.length === 0 || score <= 0) {
    endGame(false);
    updateScore(-(100 - score));
    return (
      <View style={styles.emails}>
      </View>
    );
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
            generated={generated}
          />
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    height: 100,
    width: 100,
  },
  outerEmail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  openEmail: {
    height: '60%',
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emailContent: {
    flex: 1,
    padding: 20,
  },
  emailMain: {
    fontSize: 18,
    color: '#ECF0F1',
    lineHeight: 24,
    textAlign: 'center',
    padding: 10,
  },
  emailSender: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    marginLeft: 10,
    color: '#ECF0F1',
  },
  emailLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailSubject: {
    fontSize: 14,
    color: '#ECF0F1',
  },
  emailBody: {
    fontSize: 16,
    color: '#FF4500', // A bright orange-red color for fire
  },
  emails: {
    flex: 1,
    flexDirection: 'column',
  },
  emailBox: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#555',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 0,
    overflow: 'hidden',
  },
  closeRegion: {
    flex: 0.9,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeButton: {
    width: 300,
    height: 75,
    backgroundColor: 'white',
    borderColor: 'black',
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    paddingTop: 20,
    alignItems: 'center',
    textAlign: 'center',
    fontSize: 20,
    color: 'black',
  }
});