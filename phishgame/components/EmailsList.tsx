import { Text, View, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { useFonts } from 'expo-font';

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
          {topic.length > 30 ? topic.slice(0, topic.slice(0, 30).lastIndexOf(" ")) : topic}
        </Text>
        <View style={styles.emailLine}>
          <View style={styles.emailLineBody}>
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
        </View>
      </TouchableOpacity>
    );
  } else {
    return (
        <View style={styles.emailBox}>
        <Text style={styles.emailSender}>
          {topic.length > 30 ? topic.slice(0, topic.slice(0, 30).lastIndexOf(" ")) : topic}
        </Text>
        <View style={styles.emailLine}>
        <View style={styles.emailLineBody}>
          <Text style={styles.emailSubject}>{subject}</Text>
          <Text style={styles.emailBody}>
            {" - " + content.slice(0, 145).replace(/(\r\n|\n|\r)/gm, "")}
          </Text>
        </View>
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
  emailLineBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
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
    elevation: 5,
  },
  emailMain: {
    flex: 0.2,
    flexDirection: 'column',
    height: 500,
    color: 'white',
  },
  emailSender: {
    flex: 0.23,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
    marginLeft: 10,
    color: 'white',
  },
  emailLine: {
    flex: 0.74,
  },
  emailSubject: {
    flex: 0.8,
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  emailBody: {
    flex: 1.2,
    fontSize: 14,
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